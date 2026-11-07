"""Dynamic browser-state regression checks using Node when available."""
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DynamicFrontendTests(unittest.TestCase):
    def run_node(self, script):
        if not shutil.which('node'):
            self.skipTest('Node is not installed; browser smoke tests must cover this')
        proc = subprocess.run(
            ['node', '-e', script], cwd=ROOT,
            capture_output=True, text=True, timeout=12, check=False
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_empty_insights_are_hidden_without_placeholders(self):
        self.run_node(r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('web/app.js','utf8');
const start=src.indexOf('// Optional insights do not render');
const end=src.indexOf('// Sorting logic',start);
assert(start>=0&&end>start);
const panels=[{hidden:false},{hidden:false}];
const elements=panels.map(panel=>({innerHTML:'',closest:()=>panel}));
const context={DOM:{topProcessesList:elements[0],topCountriesList:elements[1]},
  setMarkupIfChanged:(el,html)=>{el.innerHTML=html;},
  escapeHtml:s=>String(s)};
vm.createContext(context);vm.runInContext(src.slice(start,end),context);
context.renderTopProcesses([]);context.renderTopCountries([]);
assert(panels.every(p=>p.hidden));
assert(elements.every(e=>e.innerHTML===''));
context.renderTopProcesses([{name:'web',count:2}]);
context.renderTopCountries([{country:'Brazil',count:1}]);
assert(panels.every(p=>!p.hidden));
assert(elements.every(e=>e.innerHTML.includes('bar-track')));
""")

    def test_filters_follow_current_machine_data(self):
        self.run_node(r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('web/app.js','utf8');
const a=src.indexOf('function matchesChip('), b=src.indexOf('// Show Toast',a);
assert(a>=0&&b>a);
const button=val=>({dataset:val,hidden:false,classList:{toggle(){}}});
const tabs=['ALL','OUTBOUND','INBOUND','BOUND','RAW'].map(x=>button({dir:x}));
const chips=['ALL','web','dns','ssh','vpn'].map(x=>button({chip:x}));
const state={filterProto:'raw',filterState:'LISTEN',activeDirection:'INBOUND',
  activeChip:'dns',currentPage:4};
const dom={filterProto:{innerHTML:'',value:''},filterState:{innerHTML:'',value:''},
  directionTabs:{querySelectorAll:()=>tabs},chipsBar:{querySelectorAll:()=>chips}};
const ctx={AppState:state,DOM:dom,setMarkupIfChanged:(el,v)=>{el.innerHTML=v;},
  escapeHtml:x=>String(x)};
vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
ctx.refreshAvailableFilters([{proto:'tcp',state:'ESTAB',direction:'OUTBOUND',
  local:{port_int:37000,iface:'wlo1'},peer:{port_int:443},app_category:'Navegador Web',
  peer_is_public:true}]);
assert.equal(state.filterProto,'ALL');
assert.equal(state.filterState,'ALL');
assert.equal(state.activeDirection,'ALL');
assert.equal(state.activeChip,'ALL');
assert.equal(state.currentPage,1);
assert.equal(tabs[2].hidden,true);
assert.equal(tabs[1].hidden,false);
assert.equal(chips[2].hidden,true);
assert.equal(chips[1].hidden,false);
assert(dom.filterProto.innerHTML.includes('TCP'));
assert(!dom.filterProto.innerHTML.includes('RAW'));
""")

    def test_ipc_raw_and_ipv6_endpoint_formatting(self):
        self.run_node(r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('web/app.js','utf8');
const a=src.indexOf('function prettyEndpoint('),b=src.indexOf('function matchesChip(',a);
assert(a>=0&&b>a);
const ctx={};vm.createContext(ctx);vm.runInContext(src.slice(a,b),ctx);
assert.equal(ctx.prettyEndpoint({ip:'::1',port:'443'},'tcp'),'[::1]:443');
assert.equal(ctx.prettyEndpoint({ip:'*',port:'',inode:'345'},'unix'),'socket#345');
assert.equal(ctx.prettyEndpoint({ip:'*',port:'58'},'raw'),'Protocolo raw 58');
assert.equal(ctx.prettyEndpoint({ip:'0.0.0.0',port:'*'},'udp',true),'');
assert.equal(ctx.prettyEndpoint({ip:'172.16.99.209',port:'5353'},'udp',false),'172.16.99.209:5353');
""")

if __name__ == '__main__':
    unittest.main()
