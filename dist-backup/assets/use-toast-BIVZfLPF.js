import{c as S,r as T}from"./index-Cb9AmbZ7.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=S("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=S("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]),p=1,y=1e6;let c=0;function l(){return c=(c+1)%Number.MAX_SAFE_INTEGER,c.toString()}const u=new Map,d=t=>{if(u.has(t))return;const e=setTimeout(()=>{u.delete(t),n({type:"REMOVE_TOAST",toastId:t})},y);u.set(t,e)},A=(t,e)=>{switch(e.type){case"ADD_TOAST":return{...t,toasts:[e.toast,...t.toasts].slice(0,p)};case"UPDATE_TOAST":return{...t,toasts:t.toasts.map(s=>s.id===e.toast.id?{...s,...e.toast}:s)};case"DISMISS_TOAST":{const{toastId:s}=e;return s?d(s):t.toasts.forEach(o=>{d(o.id)}),{...t,toasts:t.toasts.map(o=>o.id===s||s===void 0?{...o,open:!1}:o)}}case"REMOVE_TOAST":return e.toastId===void 0?{...t,toasts:[]}:{...t,toasts:t.toasts.filter(s=>s.id!==e.toastId)}}},r=[];let i={toasts:[]};function n(t){i=A(i,t),r.forEach(e=>{e(i)})}function f({...t}){const e=l(),s=a=>n({type:"UPDATE_TOAST",toast:{...a,id:e}}),o=()=>n({type:"DISMISS_TOAST",toastId:e});return n({type:"ADD_TOAST",toast:{...t,id:e,open:!0,onOpenChange:a=>{a||o()}}}),{id:e,dismiss:o,update:s}}function _(){const[t,e]=T.useState(i);return T.useEffect(()=>(r.push(e),()=>{const s=r.indexOf(e);s>-1&&r.splice(s,1)}),[t]),{...t,toast:f,dismiss:s=>n({type:"DISMISS_TOAST",toastId:s})}}export{O as C,m as D,_ as u};
