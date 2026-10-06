# Plantão da Mudança

**O protocolo é só o começo.** Hospital Horizonte: jogo educacional em um hospital em pixel art para o Seminário Temático 5, sobre modelos e frameworks de implementação.

Três equipes investigam problemas diferentes de incorporação de um protocolo fictício de prevenção de lesão por pressão. O percurso articula Knowledge-to-Action, CFIR atualizado, PARIHS/i-PARIHS, RE-AIM e desfechos de implementação de Proctor. O áudio e a discussão acontecem no Google Meet.

## Participantes e acesso

| Papel | Quantidade | Permissão |
| --- | ---: | --- |
| Representantes de Aurora, Nexo e Pulsar | 3 | Controlar o avatar da própria equipe e registrar fontes e decisões |
| Demais alunos | 30 | Dez por equipe: acompanhar o mapa, relatos e diário da própria equipe |
| Professor | 1 | Navegar, acompanhar as três equipes, controlar a atividade e distribuir convites |
| Apresentadores do seminário | 6 | Seis avatares próprios, acesso de mediação, controle do tempo e devolutivas |

A sala comporta 40 sessões, com dez avatares controlados. Os convites fixam os papéis no servidor. As descobertas, justificativas, comunicados e devolutivas das equipes são filtrados pelo servidor; participantes não recebem os registros das outras equipes. Não há troca de recursos.

O jogo também oferece um **preview individual**, em que é possível alternar os papéis para experimentar o percurso. Esse modo não compartilha dados com uma partida.

## Publicar na Cloudflare

Este projeto usa **Cloudflare Workers com Static Assets e Durable Objects com SQLite**. Escolha **Workers**, não um projeto exclusivamente estático no Pages. O banco do objeto da sala é criado pela migração de `wrangler.jsonc`; não é necessário criar um D1 separado.

1. Entre em [Cloudflare Dashboard](https://dash.cloudflare.com/), abra **Workers & Pages**, crie uma aplicação e conecte o GitHub.
2. Selecione `tercionetopgenf/plantao`, branch `main`, com nome de Worker **`plantao`**. O nome precisa corresponder a `wrangler.jsonc`.
3. Nas configurações de build, use:

   | Campo | Valor |
   | --- | --- |
   | Diretório raiz | Raiz do repositório |
   | Build command | `pnpm run build` |
   | Deploy command | `pnpm exec wrangler deploy` |
   | Variável de build `PNPM_VERSION` | `11.25.0` |
   | Node | `22`, definido em `.nvmrc` |

   A Cloudflare instala as dependências com o lockfile antes do build. Se personalizar essa instalação, use `pnpm install --frozen-lockfile`.

4. Publique. O endereço será fornecido pela Cloudflare, normalmente em `workers.dev`. Um domínio próprio é opcional.
5. No Worker publicado, abra **Settings → Variables & Secrets** e adicione um **segredo de runtime** chamado **`SETUP_KEY`**, com uma chave longa de uso da organização. Salve/aplique a alteração. Essa chave permite criar partidas; não é uma chave de API da Cloudflare e não deve ir para o GitHub. Um segredo somente de build não estará disponível no jogo.
6. Abra o endereço do jogo, selecione **Criar partida** e informe a mesma chave da organização.
7. O criador entra como Professor e recebe os 13 convites: três para representantes, três para os demais alunos das equipes, um para Professor e seis para apresentadores. Distribua apenas o convite correspondente a cada pessoa. Quem criou a sala pode copiar os links e depois entrar pelo próprio convite de apresentador.

O projeto está preparado para o plano gratuito. Há limites de uso nos serviços da Cloudflare; os testes locais não garantem consumo, latência ou disponibilidade em produção. Confirme o funcionamento no endereço publicado antes do seminário. O áudio/vídeo continua no Meet.

Documentação: [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), [configuração](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [versões do ambiente de build](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [WebSockets em Durable Objects](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) e [preços](https://developers.cloudflare.com/durable-objects/platform/pricing/).

## Condução da atividade

1. Os participantes entram pelos seus links. Um mesmo convite de acompanhamento aceita dez sessões; cada navegador retoma a sessão ao recarregar. Use uma única aba por pessoa. Os convites de avatar retomam o mesmo papel e substituem a conexão anterior desse papel.
2. Professor ou apresentador inicia o cronômetro de **30 minutos**, podendo pausar e continuar. A contagem é compartilhada e segue o horário do servidor. Ao zerar, o jogo avisa sem apagar registros ou bloquear a discussão.
3. Os representantes percorrem o hospital por clique, setas ou WASD. Os demais participantes acompanham e podem abrir os ambientes para estudar as fontes, sem registrar decisões.
4. Cada equipe completa cinco missões. Na terceira, chega automaticamente seu comunicado, com sinal de celular. É necessário registrar a leitura antes das próximas decisões. Som depende de uma interação com a página e das permissões do navegador.
5. Quando as três equipes concluem as primeiras quatro etapas, a mediação convoca os dez avatares ao auditório.
6. Os representantes registram a quinta decisão; professor e apresentadores discutem as justificativas e registram devolutivas. O acompanhamento aparece abaixo do mapa.
7. A mediação encerra a discussão. Iris entrega o resumo da equipe em PDF; os alunos recebem o diálogo e podem baixar a própria cópia. O PDF é um guia conceitual e do caso, não uma transcrição automática dos registros digitados.

As decisões ficam na sala, cuja duração é de sete dias. Ao final desse prazo, os registros e sessões da sala são apagados automaticamente. Os PDFs conceituais permanecem como arquivos do site. Recarregar preserva o acesso na mesma aba; sair remove a credencial local, sem apagar os registros da sala. Não use dados de pacientes reais.

## Desenvolvimento e verificação

Requisitos: Node 22.13 ou superior e pnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run build
```

Para experimentar o preview individual durante desenvolvimento:

```bash
pnpm dev
```

Para a partida compartilhada local, após gerar o build:

```bash
cp .dev.vars.example .dev.vars
# Edite SETUP_KEY em .dev.vars.
pnpm run dev:worker
```

Teste de integração, que inicia um Worker local com dados temporários e 40 conexões WebSocket:

```bash
pnpm run test:runtime
```

O teste cobre convites, permissões, limite de participantes, isolamento dos registros, movimentos compartilhados, cronômetro, as 15 missões, comunicados, encontro final, devolutiva, entrega dos PDFs e reconexão. Não substitui testes visuais e de áudio em navegadores reais nem um ensaio no serviço publicado.

A execução em tempo real usa WebSockets com hibernação. Movimentos são enviados no máximo cinco vezes por segundo por avatar e não provocam gravação SQLite a cada frame. Decisões, fontes, cronômetro e devolutivas são persistidos. Ao reconectar, o cliente recebe o estado da sala.

## Conteúdo e referências

Os referenciais bibliográficos com DOI estão em `src/lib/game-data.ts`; as explicações e localizadores estão em `src/lib/hospital-consultant.ts`. Casos e tarefas ficam em `src/lib/hospital-missions.ts`.

Os três PDFs de estudo estão em `public/hospital-preview/`. Para regenerá-los, o script de autoria `scripts/build-hospital-study-guides.py` exige Python, ReportLab e fontes DejaVu. Isso não é necessário para compilar, publicar ou jogar.

Cenário, personagens, dados e consequências são fictícios. As aplicações dos referenciais são interpretações didáticas, não instrumentos validados ou recomendações clínicas. Conteúdo, código e arte foram elaborados com auxílio de inteligência artificial. A discussão e a avaliação acadêmica permanecem com docentes e discentes.
