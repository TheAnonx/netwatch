"""Static GitHub Pages build and in-browser mode isolation tests."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

from scripts.build_pages import build_site
from scripts.check_release import check_release


ROOT = Path(__file__).resolve().parents[1]


class StaticPagesTests(unittest.TestCase):
    def test_only_static_source_is_published(self):
        with tempfile.TemporaryDirectory(prefix='tmp-netwatch-pages-') as directory:
            site = Path(directory) / 'pages'
            build_site(site)
            self.assertEqual(check_release(site), 0)
            self.assertFalse((site / 'server.py').exists())
            self.assertFalse((site / 'README.md').exists())
            self.assertFalse((site / '.geo_cache.json').exists())
            self.assertFalse((site / '.netwatch-pages-token').exists())
            self.assertTrue((site / 'vendor/liquid-glass/LICENSE').exists())
            html = (site / 'index.html').read_text()
            self.assertLess(html.index('src="pages.js"'), html.index('src="app.js?'))
            self.assertIn('Content-Security-Policy', html)
            self.assertIn("connect-src 'self' http://127.0.0.1:9876", html)

    def test_build_refuses_symlink_destination(self):
        with tempfile.TemporaryDirectory(prefix='tmp-netwatch-pages-') as directory:
            folder = Path(directory)
            foreign = folder / 'foreign'
            foreign.mkdir()
            marker = foreign / 'preserve.txt'
            marker.write_text('do not remove')
            (folder / 'pages').symlink_to(foreign, target_is_directory=True)
            with self.assertRaises(ValueError):
                build_site(folder / 'pages')
            self.assertEqual(marker.read_text(), 'do not remove')

    def test_build_refuses_source_directories(self):
        with self.assertRaises(ValueError):
            build_site(ROOT / 'docs')
        self.assertTrue((ROOT / 'docs/ARCHITECTURE.md').exists())

    def test_pages_have_no_backend_runtime_injection(self):
        script = (ROOT / 'web/pages.js').read_text()
        self.assertNotIn('localStorage.', script)
        self.assertNotIn('sessionStorage.', script)
        self.assertNotIn('/api/kill', script)
        self.assertIn("credentials: 'omit'", script)
        self.assertIn("targetAddressSpace: 'loopback'", script)
        self.assertIn("'X-NetWatch-Read-Token': token", script)
        self.assertIn('window.NetWatchDemo.snapshot()', script)

    @unittest.skipUnless(shutil.which('node'), 'Node.js not installed')
    def test_embedded_page_is_unconditionally_demo_only(self):
        code = r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const js=fs.readFileSync('web/pages.js','utf8');
let requests=0;
const win={top:{},self:{},opener:null,
  NetWatchDemo:{snapshot:()=>({demo:true})}};
const document={addEventListener(){},getElementById(){return {textContent:''}}};
const ctx={window:win,document,fetch:()=>{requests++;throw Error('local fetch forbidden');}};
vm.createContext(ctx);vm.runInContext(js,ctx);
(async()=>{
 assert.equal(win.NetWatchPages.currentMode(),'demo');
 assert((await win.NetWatchPages.getSnapshot()).demo);
 win.NetWatchPages.decorateStatus();
 assert.equal(requests,0);
})().catch(error=>{console.error(error);process.exitCode=1;});
"""
        completed = subprocess.run(
            ['node', '-e', code], cwd=ROOT,
            capture_output=True, text=True, timeout=10, check=False)
        self.assertEqual(completed.returncode, 0,
                         completed.stdout + '\\n' + completed.stderr)

    @unittest.skipUnless(shutil.which('node'), 'Node.js not installed')
    def test_demo_never_connects_without_explicit_user_action(self):
        code = r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const demo=fs.readFileSync('web/demo.js','utf8');
const pages=fs.readFileSync('web/pages.js','utf8');
let requests=[],start=()=>{},formHandlers={};
const tokenField={value:'',closest:()=>null};
const connectButton={disabled:false};
const status={textContent:'',dataset:{}};
const disconnect={hidden:true,addEventListener:(event,fn)=>{disconnect.fire=fn;}};
const form={hidden:false,addEventListener:(event,fn)=>{formHandlers[event]=fn;},
 querySelector:()=>connectButton};
const panel={className:'',setAttribute(){},innerHTML:'',
 querySelector(selector){
  return ({'.pages-connection-status':status,'.pages-connection-form':form,
  '.pages-disconnect-btn':disconnect,'#pages-pairing-code':tokenField})[selector]??null;
 }};
const header={parentNode:{insertBefore(element,before){
 assert.equal(before,header);assert.equal(element,panel);
 }}};
const document={createElement:()=>panel,querySelector:()=>header,
 addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')start=fn;}};
const window={NetWatchChangeSource:()=>{window.changed=(window.changed||0)+1;}};
const ctx={window,document,console,Date,structuredClone,
 fetch:async (url,opts)=>{
  requests.push({url,opts});
  return {ok:true,json:async ()=>({status:'ok',summary:{total:0},
    sources:{inet:{status:'ok'}},connections:[]})};
 }};
vm.createContext(ctx);vm.runInContext(demo,ctx);vm.runInContext(pages,ctx);
(async ()=>{
 const sample=await window.NetWatchPages.getSnapshot();
 assert(sample.demo);
 assert(sample.connections.length>0);
 assert(sample.connections.every(x=>!x.identity_verified));
 assert(sample.connections.some(x=>x.proto==='unix'));
 assert.equal(requests.length,0,'demo must not contact localhost');
 start();
 assert.equal(form.hidden,false);
 tokenField.value='a'.repeat(40);
 await formHandlers.submit({preventDefault(){}});
 assert.equal(window.NetWatchPages.currentMode(),'live');
 assert.equal(tokenField.value,'');
 assert.equal(form.hidden,true);
 assert.equal(disconnect.hidden,false);
 assert.equal(window.changed,1);
 assert.equal(requests[0].url,'http://127.0.0.1:9876/api/connections');
 assert.equal(requests[0].opts.method,'GET');
 assert.equal(requests[0].opts.targetAddressSpace,'loopback');
 assert.equal(requests[0].opts.credentials,'omit');
 assert.equal(requests[0].opts.headers['X-NetWatch-Read-Token'],'a'.repeat(40));
 disconnect.fire();
 assert.equal(window.NetWatchPages.currentMode(),'demo');
 assert.equal(window.changed,2);
 const count=requests.length;
 const demoAgain=await window.NetWatchPages.getSnapshot();
 assert(demoAgain.demo);
 assert.equal(requests.length,count);
 console.log('PASS: demo isolation, explicit pairing, read-only fetch, disconnect');
})().catch(e=>{console.error(e);process.exitCode=1;});
"""
        completed = subprocess.run(
            ['node', '-e', code], cwd=ROOT, capture_output=True,
            text=True, timeout=15, check=False)
        self.assertEqual(completed.returncode, 0,
                         completed.stdout + '\n' + completed.stderr)


if __name__ == '__main__':
    unittest.main()
