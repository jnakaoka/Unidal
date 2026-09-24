import { useEffect, useMemo, useState } from "react";
import { Boxes, ClipboardList, PackagePlus, Warehouse } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type Material = { id:number; nome:string; unidade:string; estoque_fisico:number|string; estoque_minimo:number|string; is_active:boolean };
type Item = { id:number; material_solicitado_id:number; material_enviado_id?:number|null; quantidade_solicitada:number|string; quantidade_enviada:number|string; motivo_substituicao?:string|null };
type Pedido = { id:number; solicitante_id:number; status:string; resultado?:string|null; observacao?:string|null; motivo_conclusao_parcial?:string|null; itens:Item[] };

const n=(v:number|string)=>Number(v||0);
const Estaleiro=()=>{
 const {user}=useAuth();
 const [materiais,setMateriais]=useState<Material[]>([]);
 const [pedidos,setPedidos]=useState<Pedido[]>([]);
 const [erro,setErro]=useState("");
 const [novoMaterial,setNovoMaterial]=useState({nome:"",unidade:"un",estoque_inicial:"0",estoque_minimo:"0"});
 const [pedidoItens,setPedidoItens]=useState([{material_id:"",quantidade:"1"}]);
 const [observacao,setObservacao]=useState("");
 const funcoes=user?.funcoes||[];
 const admin=user?.perfil==="admin";
 const chefe=admin||funcoes.some(f=>f.codigo==="CHEFE_EQUIPE"&&f.is_active);
 const responsavel=admin||funcoes.some(f=>f.codigo==="RESPONSAVEL_ESTALEIRO"&&f.is_active);
 const nomeMaterial=(id?:number|null)=>materiais.find(m=>m.id===id)?.nome||`#${id}`;
 const carregar=async()=>{try{setErro("");const [m,p]=await Promise.all([api.get("/materiais/catalogo"),api.get("/materiais/pedidos")]);setMateriais(m.data);setPedidos(p.data)}catch(e:any){setErro(e?.response?.data?.detail||"Não foi possível carregar o estaleiro.")}};
 useEffect(()=>{carregar()},[]);
 const alertas=useMemo(()=>materiais.filter(m=>n(m.estoque_fisico)<=n(m.estoque_minimo)),[materiais]);
 const criarMaterial=async(e:any)=>{e.preventDefault();try{await api.post("/materiais/catalogo",{...novoMaterial,estoque_inicial:Number(novoMaterial.estoque_inicial),estoque_minimo:Number(novoMaterial.estoque_minimo)});setNovoMaterial({nome:"",unidade:"un",estoque_inicial:"0",estoque_minimo:"0"});carregar()}catch(e:any){alert(e?.response?.data?.detail||"Erro ao cadastrar material.")}};
 const criarPedido=async(e:any)=>{e.preventDefault();const itens=pedidoItens.filter(i=>i.material_id).map(i=>({material_id:Number(i.material_id),quantidade:Number(i.quantidade)}));if(!itens.length)return alert("Adicione pelo menos um material.");try{await api.post("/materiais/pedidos",{itens,observacao:observacao||null});setPedidoItens([{material_id:"",quantidade:"1"}]);setObservacao("");carregar()}catch(e:any){alert(e?.response?.data?.detail||"Erro ao criar pedido.")}};
 const atender=async(p:Pedido,i:Item)=>{const q=prompt("Quantidade enviada:",String(i.quantidade_solicitada));if(q===null)return;const sub=prompt("ID do material substituto (deixe vazio para o solicitado):","");let motivo:string|null=null;if(sub)motivo=prompt("Motivo da substituição:","")||"";try{await api.put(`/materiais/pedidos/${p.id}/itens/${i.id}`,{quantidade_enviada:Number(q),material_enviado_id:sub?Number(sub):null,motivo_substituicao:motivo});carregar()}catch(e:any){alert(e?.response?.data?.detail||"Erro ao atender item.")}};
 const concluir=async(p:Pedido)=>{const parcial=p.itens.some(i=>n(i.quantidade_enviada)<n(i.quantidade_solicitada));const motivo=parcial?prompt("Este pedido está parcial. Informe o motivo:",""):null;if(parcial&&!motivo)return;try{await api.post(`/materiais/pedidos/${p.id}/concluir`,{motivo_parcial:motivo});carregar()}catch(e:any){alert(e?.response?.data?.detail||"Erro ao concluir pedido.")}};
 return <div className="p-4 md:p-6 space-y-6">
  <div><h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Warehouse size={26}/>Estaleiro</h1><p className="text-gray-500">Pedidos de materiais, preparação e controle de estoque.</p></div>
  {erro&&<div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{erro}</div>}
  {responsavel&&alertas.length>0&&<div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><b>Estoque baixo:</b> {alertas.map(m=>`${m.nome} (${m.estoque_fisico} ${m.unidade})`).join(", ")}</div>}
  <div className="grid gap-6 xl:grid-cols-2">
   {chefe&&<form onSubmit={criarPedido} className="rounded-lg bg-white p-5 shadow"><h2 className="mb-4 font-semibold flex gap-2"><ClipboardList size={20}/>Novo pedido</h2>
    {pedidoItens.map((it,idx)=><div key={idx} className="mb-3 grid grid-cols-[1fr_120px_40px] gap-2"><select className="border rounded px-3 py-2" value={it.material_id} onChange={e=>setPedidoItens(v=>v.map((x,j)=>j===idx?{...x,material_id:e.target.value}:x))}><option value="">Selecione o material</option>{materiais.map(m=><option key={m.id} value={m.id}>{m.nome} — disponível {m.estoque_fisico} {m.unidade}</option>)}</select><input className="border rounded px-3 py-2" type="number" min=".001" step=".001" value={it.quantidade} onChange={e=>setPedidoItens(v=>v.map((x,j)=>j===idx?{...x,quantidade:e.target.value}:x))}/><button type="button" className="text-red-500" onClick={()=>setPedidoItens(v=>v.filter((_,j)=>j!==idx))}>×</button></div>)}
    <button type="button" className="text-indigo-600 text-sm" onClick={()=>setPedidoItens(v=>[...v,{material_id:"",quantidade:"1"}])}>+ Adicionar item</button>
    <textarea className="mt-3 w-full border rounded p-2" placeholder="Observação do pedido (opcional)" value={observacao} onChange={e=>setObservacao(e.target.value)}/>
    <button className="mt-3 rounded bg-indigo-600 px-4 py-2 text-white">Enviar pedido</button>
   </form>}
   {responsavel&&<form onSubmit={criarMaterial} className="rounded-lg bg-white p-5 shadow"><h2 className="mb-4 font-semibold flex gap-2"><PackagePlus size={20}/>Cadastrar material</h2><div className="grid gap-3 sm:grid-cols-2"><input required className="border rounded px-3 py-2" placeholder="Nome" value={novoMaterial.nome} onChange={e=>setNovoMaterial({...novoMaterial,nome:e.target.value})}/><input required className="border rounded px-3 py-2" placeholder="Unidade" value={novoMaterial.unidade} onChange={e=>setNovoMaterial({...novoMaterial,unidade:e.target.value})}/><input className="border rounded px-3 py-2" type="number" min="0" step=".001" placeholder="Estoque inicial" value={novoMaterial.estoque_inicial} onChange={e=>setNovoMaterial({...novoMaterial,estoque_inicial:e.target.value})}/><input className="border rounded px-3 py-2" type="number" min="0" step=".001" placeholder="Estoque mínimo" value={novoMaterial.estoque_minimo} onChange={e=>setNovoMaterial({...novoMaterial,estoque_minimo:e.target.value})}/></div><button className="mt-3 rounded bg-indigo-600 px-4 py-2 text-white">Cadastrar</button></form>}
  </div>
  {responsavel&&<section className="rounded-lg bg-white p-5 shadow"><h2 className="mb-4 font-semibold flex gap-2"><Boxes size={20}/>Estoque</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Material</th><th>Unidade</th><th>Estoque</th><th>Mínimo</th><th>Situação</th></tr></thead><tbody>{materiais.map(m=><tr key={m.id} className="border-b"><td className="p-2 font-medium">{m.nome}</td><td>{m.unidade}</td><td>{m.estoque_fisico}</td><td>{m.estoque_minimo}</td><td>{n(m.estoque_fisico)<=n(m.estoque_minimo)?<span className="text-amber-700 font-medium">Baixo</span>:"Normal"}</td></tr>)}</tbody></table></div></section>}
  <section className="rounded-lg bg-white p-5 shadow"><h2 className="mb-4 font-semibold">Pedidos</h2><div className="space-y-4">{pedidos.length===0&&<p className="text-gray-500">Nenhum pedido.</p>}{pedidos.map(p=><div key={p.id} className="rounded border p-4"><div className="flex flex-wrap justify-between gap-2"><div><b>Pedido #{p.id}</b> <span className="ml-2 text-sm text-gray-500">{p.status}</span>{p.resultado&&<span className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs">{p.resultado}</span>}</div>{responsavel&&p.status!=="CONCLUIDO"&&<button onClick={()=>concluir(p)} className="rounded bg-emerald-600 px-3 py-1 text-sm text-white">Concluir pedido</button>}</div>{p.observacao&&<p className="mt-2 text-sm text-gray-600">{p.observacao}</p>}<div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-1">Solicitado</th><th>Qtd.</th><th>Enviado</th><th>Qtd.</th>{responsavel&&<th>Ação</th>}</tr></thead><tbody>{p.itens.map(i=><tr key={i.id} className="border-b"><td className="py-2">{nomeMaterial(i.material_solicitado_id)}</td><td>{i.quantidade_solicitada}</td><td>{i.material_enviado_id?nomeMaterial(i.material_enviado_id):"—"}{i.motivo_substituicao&&<div className="text-xs text-gray-500">{i.motivo_substituicao}</div>}</td><td>{i.quantidade_enviada}</td>{responsavel&&<td><button disabled={p.status==="CONCLUIDO"} onClick={()=>atender(p,i)} className="text-indigo-600 disabled:text-gray-300">Atender</button></td>}</tr>)}</tbody></table></div>{p.motivo_conclusao_parcial&&<p className="mt-2 text-sm text-amber-700">Conclusão parcial: {p.motivo_conclusao_parcial}</p>}</div>)}</div></section>
 </div>
};
export default Estaleiro;
