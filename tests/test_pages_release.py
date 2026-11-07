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
    def test_discreet_source_menu_toggles_closes_and_pairs_explicitly(self):
        code = r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const demo=fs.readFileSync('web/demo.js','utf8');
const pages=fs.readFileSync('web/pages.js','utf8');
const requests=[], events={}, formHandlers={}, handlers={}, focus=[];
const trigger={type:'',className:'',textContent:'',attrs:{},
 setAttribute(name,val){this.attrs[name]=val;},
 getBoundingClientRect(){return {top:30,bottom:62,right:1180};},
 contains(target){return target===this;},
 addEventListener(name,fn){handlers['trigger:'+name]=fn;},
 focus(){focus.push('trigger');}};
const tokenField={value:'',focus(){focus.push('pairing');}};
const connectButton={disabled:false};
const status={textContent:'',dataset:{}};
const description={textContent:''};
const disconnect={hidden:true,focus(){focus.push('disconnect');},
 addEventListener:(event,fn)=>{handlers['disconnect:'+event]=fn;}};
const form={hidden:false,addEventListener:(event,fn)=>{formHandlers[event]=fn;},
 querySelector:()=>connectButton};
const menu={id:'',className:'',hidden:true,attrs:{},style:{},innerHTML:'',
 setAttribute(name,val){this.attrs[name]=val;},
 querySelector(selector){return ({
   '.pages-connection-status':status,'.pages-connection-form':form,
   '.pages-disconnect-btn':disconnect,'#pages-pairing-code':tokenField,
   '.pages-source-intro p':description
 })[selector]??null;},
 getBoundingClientRect(){return {width:340,height:260};},
 contains(target){return target===this;}};
const headerRight={appendChild(element){assert.equal(element,trigger);this.child=element;}};
const body={appendChild(element){assert.equal(element,menu);this.child=element;}};
const document={body,createElement(name){return name==='button'?trigger:menu;},
 querySelector(name){assert.equal(name,'.header-right');return headerRight;},
 addEventListener(name,fn){events[name]=fn;},
 getElementById(){return {textContent:''};}};
const window={innerWidth:1200,innerHeight:800,opener:null,
 addEventListener(name,fn){handlers['window:'+name]=fn;},
 NetWatchChangeSource:()=>{window.changed=(window.changed||0)+1;}};
window.top=window;window.self=window;
const ctx={window,document,Date,console,structuredClone,fetch:async(url,opts)=>{
 requests.push({url,opts});
 return {ok:true,json:async()=>({status:'ok',summary:{total:0},
  sources:{inet:{status:'ok'}},connections:[]})};
}};
vm.createContext(ctx);vm.runInContext(demo,ctx);vm.runInContext(pages,ctx);
(async()=>{
 const sample=await window.NetWatchPages.getSnapshot();
 assert(sample.demo);assert.equal(requests.length,0,'demo cannot fetch before click');
 events.DOMContentLoaded();
 assert.equal(headerRight.child,trigger);
 assert.equal(body.child,menu,'menu must be outside the optical header');
 assert.equal(menu.hidden,true,'no permanent banner');
 assert.equal(trigger.attrs['aria-expanded'],'false');
 assert.equal(trigger.attrs['aria-haspopup'],'dialog');
 assert.equal(menu.attrs.role,'dialog');
 assert.equal(trigger.textContent,'Fonte');

 handlers['trigger:click']();
 assert.equal(menu.hidden,false);
 assert.equal(trigger.attrs['aria-expanded'],'true');
 assert.equal(focus.at(-1),'pairing');
 assert.equal(menu.style.left,'840px');
 handlers['trigger:click']();
 assert.equal(menu.hidden,true);
 assert.equal(trigger.attrs['aria-expanded'],'false');

 handlers['trigger:click']();
 events.click({target:menu});
 assert.equal(menu.hidden,false,'click inside must not close');
 events.click({target:trigger});
 assert.equal(menu.hidden,false,'outside listener must not undo trigger action');
 events.click({target:{other:true}});
 assert.equal(menu.hidden,true,'outside click closes');

 handlers['trigger:click']();
 let prevented=false;
 events.keydown({key:'Escape',preventDefault(){prevented=true;}});
 assert(prevented);assert.equal(menu.hidden,true);
 assert.equal(focus.at(-1),'trigger');

 // Responsive positioning is independent of viewport width.
 window.innerWidth=390;
 handlers['trigger:click']();
 assert(Number.parseInt(menu.style.left,10)>=12);
 assert(Number.parseInt(menu.style.left,10)+340<=390-12);
 tokenField.value='short';
 await formHandlers.submit({preventDefault(){}});
 assert.equal(requests.length,0,'invalid code must never touch loopback');
 assert.equal(menu.hidden,false);
 tokenField.value='a'.repeat(40);
 await formHandlers.submit({preventDefault(){}});
 assert.equal(window.NetWatchPages.currentMode(),'live');
 assert.equal(menu.hidden,true,'success should collapse menu');
 assert.equal(tokenField.value,'');
 assert.equal(window.changed,1);
 assert.equal(requests[0].url,'http://127.0.0.1:9876/api/connections');
 assert.equal(requests[0].opts.method,'GET');
 assert.equal(requests[0].opts.credentials,'omit');
 assert.equal(requests[0].opts.targetAddressSpace,'loopback');
 assert.equal(requests[0].opts.headers['X-NetWatch-Read-Token'],'a'.repeat(40));
 handlers['trigger:click']();
 assert.equal(form.hidden,true);
 assert.equal(disconnect.hidden,false);
 assert(description.textContent.includes('Conectado ao coletor local'));
 handlers['disconnect:click']();
 assert.equal(window.NetWatchPages.currentMode(),'demo');
 assert.equal(menu.hidden,true);
 assert.equal(window.changed,2);
 const count=requests.length;
 const again=await window.NetWatchPages.getSnapshot();
 assert(again.demo);assert.equal(requests.length,count);
 console.log('PASS: discreet menu, toggle, outside, Escape, responsive, pairing, disconnect');
})().catch(e=>{console.error(e);process.exitCode=1;});
"""
        result = subprocess.run(
            ['node', '-e', code], cwd=ROOT, capture_output=True,
            text=True, timeout=15, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + '\n' + result.stderr)

if __name__ == '__main__':
    unittest.main()
