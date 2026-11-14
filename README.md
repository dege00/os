# OS - acompanhamento público

Página estática, sem build, para o cliente consultar uma ordem de serviço pelo código público. Tem layout responsivo e funciona em qualquer navegador moderno.

## Como usar

1. Abra `index.html` ou publique a pasta (GitHub Pages, Nginx etc.).
2. Informe o endereço da API, por exemplo `https://seudominio.com.br` ou `http://192.168.1.110:8000`.
3. Informe o código da OS (o mesmo token do link de acompanhamento).
4. Clique em **Consultar**.

Também é possível abrir direto com o código na URL:

```text
index.html?token=CODIGO_DA_OS
```

O endereço da API fica salvo no `localStorage` do navegador.

## Recursos

- Status da OS com cores para facilitar a leitura.
- Resumo com previsão de entrega, total e garantia.
- Histórico em linha do tempo, do evento mais recente ao mais antigo.
- Itens, fotos e contato direto com a loja pelo WhatsApp.
- Botões para copiar o link de acompanhamento e imprimir a consulta.

## API usada

```text
GET /api/publico/os/<token>/
```

A resposta mostra loja, cliente, aparelho, defeito, status, previsão, itens, histórico e fotos marcadas como visíveis. Não precisa de login nem envia `Authorization`.

## CORS

O endpoint público não exige autenticação, mas o navegador ainda aplica CORS. Se esta página estiver em um domínio diferente da API (por exemplo, GitHub Pages), a API precisa liberar essa origem.

Opções:

- servir esta página no mesmo domínio da API; ou
- habilitar CORS no Django para a origem onde a página está publicada.

Sem isso, o navegador bloqueia o `fetch` e a página mostra o aviso de CORS.

## Limitações desta versão

- Somente leitura: não cria, edita nem exclui OS.
- Mostra apenas as fotos com `visivel_cliente` marcado.
- O código da OS é público; não use dados sensíveis além dos que já aparecem no link de acompanhamento.
