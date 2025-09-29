// RegistroHorasForm.tsx
import { Button } from "./ui/button";

interface Cliente {
  id: number;
  nome: string;
  is_active: boolean;
}

interface Obra {
  id: number;
  nome: string;
  descricao?: string;
  cliente_id: number;
  cliente?: { id: number; nome: string };
}

type Props = {
  userName?: string;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  clientes: Cliente[];
  obras: Obra[];
  // ...demais props úteis (handlers, flags, etc.)
  onSalvar: () => void;
  onCancelar: () => void;
};
export default function RegistroHorasForm(props: Props) {
  const { userName, formData, setFormData, clientes, obras, onSalvar, onCancelar } = props;
  return (
    <>
      {/* TODO: seu grid com inputs/checkboxes (sem portal) */}
      <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
        {/* ...campos... */}
      </div>
      <div className="px-6 py-4 border-t flex justify-end gap-2">
        <Button className="btn-bg-blue-500" onClick={onSalvar}>Salvar</Button>
        <Button className="generic-btn" variant="outline" onClick={onCancelar}>Cancelar</Button>
      </div>
    </>
  );
}
