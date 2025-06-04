import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectItem } from '../components/ui/select';

interface Projeto {
  id: number;
  nome: string;
}

const RegistroHoras: React.FC = () => {
  const { user } = useAuth();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [projetoId, setProjetoId] = useState('');
  const [data, setData] = useState('');
  const [horas, setHoras] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const response = await api.get<Projeto[]>('/projetos');
        setProjetos(response.data);
      } catch (error) {
        console.error('Erro ao buscar projetos:', error);
      }
    };

    fetchProjetos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/registro-horas', {
        projeto_id: projetoId,
        data,
        horas: Number(horas),
        descricao,
      });

      setProjetoId('');
      setData('');
      setHoras('');
      setDescricao('');
      alert('Horas registradas com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar horas:', error);
      alert('Erro ao registrar horas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Registrar Horas</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Projeto</Label>
          <Select value={projetoId} onChange={setProjetoId}>
            <SelectItem value="">Selecione um projeto</SelectItem>
            {projetos.map((projeto) => (
              <SelectItem key={projeto.id} value={projeto.id.toString()}>
                {projeto.nome}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <Label>Data</Label>
          <Input
            type="date"
            value={data}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Horas</Label>
          <Input
            type="number"
            min="1"
            max="24"
            value={horas}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoras(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            value={descricao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricao(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registrando...' : 'Registrar Horas'}
        </Button>
      </form>
    </div>
  );
};

export default RegistroHoras;
