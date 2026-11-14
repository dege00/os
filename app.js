const API_PADRAO = 'http://localhost:8000'
const TIPO_FOTO = { entrada: 'Entrada', servico: 'Serviço' }

const estado = {
  base: localStorage.getItem('os_api_base') || (location.protocol.startsWith('http') ? location.origin : API_PADRAO),
}

const $ = (id) => document.getElementById(id)

function normalizarBase(valor) {
  let base = String(valor || '').trim()
  if (!base) return ''
  if (!/^https?:\/\//i.test(base)) base = 'http://' + base
  return base.replace(/\/+$/, '').replace(/\/api$/i, '')
}

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

function brl(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dataBR(valor) {
  if (!valor) return '—'
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-')
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : '—'
}

function dataHoraBR(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function urlMidia(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url)
      return estado.base + u.pathname + u.search + u.hash
    } catch {
      return url
    }
  }
  return estado.base + (url.startsWith('/') ? url : '/' + url)
}

function linkWhatsApp(telefone) {
  let numero = String(telefone || '').replace(/\D/g, '')
  if (!numero) return ''
  if (!numero.startsWith('55')) numero = '55' + numero
  return `https://wa.me/${numero}`
}

function mostrarErro(mensagem) {
  $('erro').textContent = mensagem
}

function tomStatus(label) {
  const texto = String(label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/(entreg|finaliz|conclu|retirad)/.test(texto)) return 'ok'
  if (/(cancel|recus|sem conserto)/.test(texto)) return 'erro'
  if (/(pronto|disponivel)/.test(texto)) return 'pronto'
  if (/(andamento|reparo|execu|bancada|diagnos|teste)/.test(texto)) return 'andamento'
  if (/(orcamento|aprov|aguardando)/.test(texto)) return 'atencao'
  return 'neutro'
}

function renderizar(dados) {
  const itens = dados.itens || []
  const fotos = dados.fotos || []
  const historico = (dados.historico || []).slice().reverse()
  const telefone = linkWhatsApp(dados.loja_telefone)
  const total = dados.total === null || dados.total === undefined ? 'Em análise' : brl(dados.total)

  const linhasItens = itens.map((item) => `
    <tr>
      <td>${escapar(item.descricao)}</td>
      <td>${escapar(item.quantidade)}</td>
      <td>${brl(item.subtotal)}</td>
    </tr>`).join('')

  const linhasHistorico = historico.map((item) => `
    <tr>
      <td>${escapar(item.label)}</td>
      <td>${dataHoraBR(item.em)}</td>
    </tr>`).join('')

  const galeria = fotos.map((foto) => {
    const url = escapar(urlMidia(foto.url))
    const legenda = escapar(foto.legenda || TIPO_FOTO[foto.tipo] || 'Foto')
    return `<p><a href="${url}" target="_blank" rel="noopener">
      <img src="${url}" alt="${legenda}" width="180"><br>${legenda}
    </a></p>`
  }).join('')

  $('resultado').innerHTML = `
    <section class="card resultado-os">
      <div class="os-topo">
        <div>
          <p class="os-numero">OS #${escapar(dados.numero)}</p>
          <h2>${escapar(dados.loja)}</h2>
        </div>
        <span class="selo ${tomStatus(dados.status_label)}">${escapar(dados.status_label)}</span>
      </div>
      ${telefone ? `<p><a href="${telefone}" target="_blank" rel="noopener">Falar com a loja no WhatsApp</a></p>` : ''}
    <table>
      <tr><th>Cliente</th><td>${escapar(dados.cliente)}</td></tr>
      <tr><th>Aparelho</th><td>${escapar(dados.aparelho)}</td></tr>
      <tr><th>Defeito</th><td>${escapar(dados.defeito)}</td></tr>
      <tr><th>Previsão de entrega</th><td>${dataBR(dados.previsao_entrega)}</td></tr>
      <tr><th>Total</th><td>${total}</td></tr>
      <tr><th>Garantia</th><td>${escapar(dados.garantia_dias)} dias</td></tr>
    </table>

    <h3>Itens</h3>
    ${itens.length ? `<table>
      <thead><tr><th>Descrição</th><th>Qtd.</th><th>Subtotal</th></tr></thead>
      <tbody>${linhasItens}</tbody>
    </table>` : '<p>Nenhum item informado.</p>'}

    <h3>Histórico</h3>
    ${historico.length ? `<table>
      <thead><tr><th>Status</th><th>Quando</th></tr></thead>
      <tbody>${linhasHistorico}</tbody>
    </table>` : '<p>Sem histórico.</p>'}

    <h3>Fotos</h3>
    ${galeria || '<p>Nenhuma foto disponível.</p>'}
    </section>
  `
  $('resultado').hidden = false
}

async function consultar(evento) {
  if (evento) evento.preventDefault()

  const base = normalizarBase($('api-base').value)
  const token = $('token').value.trim()
  if (!base) return mostrarErro('Informe o endereço da API.')
  if (!token) return mostrarErro('Informe o código da OS.')

  estado.base = base
  localStorage.setItem('os_api_base', base)
  $('api-base').value = base
  mostrarErro('')
  $('resultado').hidden = true
  $('carregando').hidden = false
  $('consultar').disabled = true

  try {
    const resposta = await fetch(`${base}/api/publico/os/${encodeURIComponent(token)}/`)
    if (resposta.status === 404) throw new Error('OS não encontrada. Confira o código.')
    if (!resposta.ok) throw new Error(`A API respondeu ${resposta.status}.`)
    const dados = await resposta.json()
    renderizar(dados)
    $('atualizar').disabled = false
    const url = new URL(location.href)
    url.searchParams.set('token', token)
    history.replaceState(null, '', url)
  } catch (erro) {
    if (erro instanceof TypeError) {
      mostrarErro('Não foi possível falar com a API. Confira o endereço e o CORS.')
    } else {
      mostrarErro(erro.message)
    }
  } finally {
    $('carregando').hidden = true
    $('consultar').disabled = false
  }
}

$('form-consulta').addEventListener('submit', consultar)
$('atualizar').addEventListener('click', consultar)
$('api-base').value = estado.base

const tokenDaUrl = new URLSearchParams(location.search).get('token')
if (tokenDaUrl) {
  $('token').value = tokenDaUrl
  consultar()
}
