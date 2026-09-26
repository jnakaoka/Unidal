import { ReactNode } from "react";
type Props={open:boolean;title:string;children:ReactNode;onClose:()=>void;footer?:ReactNode};
export default function Modal({open,title,children,onClose,footer}:Props){
 if(!open)return null;
 return <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
  <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
   <div className="flex items-center justify-between border-b p-5"><h3 className="text-lg font-semibold">{title}</h3><button type="button" onClick={onClose} className="text-gray-500">Fechar</button></div>
   <div className="p-5">{children}</div>
   {footer&&<div className="flex justify-end gap-2 border-t bg-gray-50 p-4">{footer}</div>}
  </div>
 </div>
}