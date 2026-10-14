const nomes: Record<string, string> = {
  laserComManobrador: 'Máq. Laser com manobrador', poComManobrador: 'Máq. Pó com manobrador',
  laserWS940CComManobrador: 'Laser WS940C com manobrador', lazerYZ30ComManobrador: 'Laser YZ30 com manobrador',
  soLaser: 'Só máquina Laser', soPo: 'Só máquina Pó', soMaqLaserWS940C: 'Só Laser WS940C',
  soMaqLazerYZ30: 'Só Laser YZ30', manobradorApenas: 'Manobrador de máquina apenas', manobrador: 'Manobrador',
  checked: 'Selecionado', m2: 'Área (m²)', qtd: 'Quantidade', empresa: 'Empresa',
  manobrador_user_id: 'Utilizador', user_id: 'Utilizador', double_journey: 'Double Journey',
  intemperie: 'Intempérie', manobradores: 'Manobradores', opcao: 'Máquina',
};
const nome = (chave: string) => nomes[chave] || chave.replaceAll('_', ' ');
const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function formatarAlteracao(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
  if (campo === 'intervencao_maquinas_opcoes' && objeto(valor)) {
    const linhas = Object.entries(valor).flatMap(([chave, detalhe]) => {
      if (chave === 'manobradores' && Array.isArray(detalhe)) {
        return detalhe.map(item => formatarAlteracao('manobrador', item));
      }
      if (!objeto(detalhe) || !detalhe.checked) return [];
      const dados = Object.entries(detalhe).filter(([k, v]) => k !== 'checked' && v !== null && v !== '' && v !== false);
      return [`${nome(chave)}${dados.length ? ': ' + dados.map(([k, v]) => `${nome(k)}: ${formatarAlteracao(k, v)}`).join(' · ') : ''}`];
    });
    return linhas.join('\n') || 'Nenhuma opção selecionada';
  }
  if (Array.isArray(valor)) return valor.map(item => formatarAlteracao(campo, item)).join('\n') || '—';
  if (objeto(valor)) {
    return Object.entries(valor).map(([k, v]) => `${nome(k)}: ${formatarAlteracao(k, v)}`).join(' · ') || '—';
  }
  if (campo === 'opcao') return nome(String(valor));
  if (campo === 'data' && /^\d{4}-\d{2}-\d{2}$/.test(String(valor))) return String(valor).split('-').reverse().join('/');
  return String(valor);
}
