import { useEffect, useMemo, useState } from "react";

type Material={id:number;nome:string;unidade:string;estoque_disponivel:number|string};
type Props={materiais:Material[];value:string;onChange:(id:string)=>void};

export default function MaterialSearch({materiais,value,onChange}:Props){
 const atual=materiais.find(m=>String(m.id)===value);
 const [texto,setTexto]=useState(atual?.nome||"");
 const [aberto,setAberto]=useState(false);
 useEffect(()=>{
  const selecionado=materiais.find(m=>String(m.id)===value);
  setTexto(selecionado?.nome||"");
  if(!value)setAberto(false);
 },[value,materiais]);
 const opcoes=useMemo(()=>{const q=texto.trim().toLocaleLowerCase();return materiais.filter(m=>!q||m.nome.toLocaleLowerCase().includes(q)).slice(0,10)},[materiais,texto]);
 return <div className="relative">
  <input className="w-full rounded border px-3 py-2" placeholder="Pesquisar material..." value={texto} onFocus={()=>setAberto(true)} onChange={e=>{setTexto(e.target.value);onChange("");setAberto(true)}}/>
  {aberto&&<div className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow-lg">{opcoes.length?opcoes.map(m=><button key={m.id} type="button" className="block w-full border-b px-3 py-2 text-left text-sm hover:bg-gray-50" onMouseDown={e=>e.preventDefault()} onClick={()=>{setTexto(m.nome);onChange(String(m.id));setAberto(false)}}><span className="font-medium">{m.nome}</span><span className="ml-2 text-gray-500">disponível {Math.trunc(Number(m.estoque_disponivel||0))} {m.unidade}</span></button>):<div className="p-3 text-sm text-gray-500">Nenhum material encontrado.</div>}</div>}
 </div>
}