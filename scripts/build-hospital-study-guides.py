import json,html,subprocess
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
root=Path(__file__).resolve().parents[1]
# Authoring helper: reportlab and DejaVu fonts are required only to regenerate PDFs.
content=subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',"import {cases} from './src/lib/hospital-missions.ts';import {frameworkTopics} from './src/lib/hospital-consultant.ts';import {actors} from './src/lib/hospital-preview.ts';import {references} from './src/lib/game-data.ts';console.log(JSON.stringify({cases,frameworkTopics,actors,references}));"],cwd=root,text=True)
data=json.loads(content)
for name,file in [('Study','DejaVuSans.ttf'),('StudyBold','DejaVuSans-Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('Study',normal='Study',bold='StudyBold',italic='Study',boldItalic='StudyBold')
navy=colors.HexColor('#17374b');teal=colors.HexColor('#207766');muted=colors.HexColor('#456476')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle('BodyStudy',fontName='Study',fontSize=10.5,leading=15,textColor=navy,spaceAfter=9))
styles.add(ParagraphStyle('TitleStudy',fontName='StudyBold',fontSize=25,leading=30,textColor=navy,spaceAfter=16))
styles.add(ParagraphStyle('HeadingStudy',fontName='StudyBold',fontSize=17,leading=22,textColor=teal,spaceBefore=8,spaceAfter=10))
styles.add(ParagraphStyle('SmallStudy',fontName='Study',fontSize=9,leading=13,textColor=muted,spaceAfter=8))
styles.add(ParagraphStyle('CellStudy',fontName='Study',fontSize=9.5,leading=13,textColor=navy))
styles.add(ParagraphStyle('CalloutStudy',fontName='Study',fontSize=10.5,leading=16,textColor=navy,backColor=colors.HexColor('#e8f3ef'),borderPadding=12,spaceBefore=7,spaceAfter=20))
def esc(s):return html.escape(s)
def p(s,style='BodyStudy'):return Paragraph(s,styles[style])
def text(s,style='BodyStudy'):return p(esc(s),style)
def table(rows,widths):
 t=Table([[p(esc(v),'CellStudy') for v in row] for row in rows],colWidths=widths,hAlign='LEFT')
 t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8f3ef')),('LINEBELOW',(0,0),(-1,-1),.35,colors.HexColor('#abc9c6')),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
 return t
def footer(canvas,doc):
 canvas.saveState();canvas.setStrokeColor(colors.HexColor('#a4c6c0'));canvas.line(44,43,A4[0]-44,43)
 canvas.setFont('Study',8);canvas.setFillColor(muted);canvas.drawString(44,29,'Plantão da Mudança • Grupo 5 • Resumo para estudo')
 canvas.drawRightString(A4[0]-44,29,str(doc.page));canvas.restoreState()
slugs=['aurora','nexo','pulsar']
focus=[
 'Fidelidade: observe oportunidades elegíveis e os componentes essenciais executados. Compare observação e registro. Defina o critério de completude, quem audita e o período; uma tela preenchida não comprova o cuidado.',
 'Viabilidade: confronte relatos com tempo de busca, faltas e execução em demandas diferentes. Custo: explicite período, perspectiva e recursos incrementais da implementação, incluindo tempo e perdas; não some toda a assistência habitual.',
 'Sustentabilidade: examine uso e execução repetidamente, junto de integração, responsabilidades e recursos. Separe os recém-admitidos e atualize os denominadores. Um único ponto em seis meses não prova continuidade futura.'
]
rea=[
 'Alcance simulado: 18/24 = 75%; diurno 14/16 = 87,5%; noturno 4/8 = 50%. O total esconde diferenças. Investigue perfil e oportunidades antes de atribuir a diferença ao turno.',
 'Adoção simulada: 3/4 equipes = 75%. Investigue quem iniciou e quem ficou de fora. A medida não comprova execução consistente. Os R$ 720 observados incluem materiais, tempo e perdas; a composição da estimativa inicial precisa ser explicitada.',
 'Manutenção simulada: 18/30 = 60% no total; 4/12 = 33,3% entre recém-admitidos; demais 14/18 = 77,8%. Os 12 novos fazem parte dos 30. Os grupos têm trajetórias e exposição diferentes; a comparação não demonstra causalidade.'
]
for i,c in enumerate(data['cases']):
 actor=data['actors'][i];story=[]
 story.extend([text('GRUPO 5 • MODELOS E FRAMEWORKS DE IMPLEMENTAÇÃO','SmallStudy'),text(actor['name'],'TitleStudy'),text(c['title'],'HeadingStudy'),text('“Leve as perguntas com você. Este material reúne os conceitos e o caso para que você continue a discussão depois do jogo.” — Iris','CalloutStudy'),text('O problema que investigamos','HeadingStudy'),text(c['problem']),text('Objetivos da missão','HeadingStudy')])
 for o in c['objectives']:story.append(text('• '+o))
 story.extend([text('Dados iniciais do caso fictício','HeadingStudy'),table([['Medida','Dado','O que representa']]+[[d['label'],d['value'],d['meaning']] for d in c['data']],[130,70,A4[0]-288]),Spacer(1,12),text('Simulação educacional. Dados, pacientes e personagens fictícios. As aplicações dos referenciais são interpretações didáticas, não recomendações clínicas ou um instrumento validado.','SmallStudy'),PageBreak()])
 story.append(text('Do conhecimento à mudança','TitleStudy'))
 for j in range(3):
  f=data['frameworkTopics'][j]
  block=[text(f['name'],'HeadingStudy'),text(f['explanation']),p('<b>No seu caso:</b> '+esc(f['examples'][i])),p('<b>Evite:</b> '+esc(f['pitfall'])),text('Base: '+'; '.join(s['label'] for s in f['source']),'SmallStudy')]
  if j==1:block.insert(2,text('Domínios: inovação; contexto externo; contexto interno; indivíduos; processo.'))
  if j==2:block.insert(2,text('A facilitação exige ações: avaliar necessidades, negociar condições, preparar pessoas e acompanhar a incorporação. Nomear alguém não equivale a facilitar.'))
  story.extend([KeepTogether(block),Spacer(1,8)])
 story.append(PageBreak())
 f=data['frameworkTopics'][3]
 story.extend([text('Planejar e avaliar com RE-AIM','TitleStudy'),text(f['explanation']),table([['Dimensão','Pergunta de estudo']]+[[d['label'],d['meaning']] for d in f['concepts']],[110,A4[0]-198]),Spacer(1,15),text('Aplicação à missão','HeadingStudy'),text(rea[i]),text('Ficha de um indicador','HeadingStudy'),text('Registre: dimensão ou desfecho; unidade de análise; numerador; denominador; fonte; momento; responsável; critério para revisar o plano. Analise quem ficou de fora e os efeitos indesejados.'),text(f['pitfall'],'CalloutStudy'),text('Base: Glasgow et al., 2019. As definições abrangem níveis individual e organizacional; as medidas dependem do projeto.','SmallStudy'),PageBreak()])
 f=data['frameworkTopics'][4]
 story.extend([text('Desfechos de implementação','TitleStudy'),text(f['explanation']),table([['Desfecho','O que investigar']]+[[d['label'],d['meaning']] for d in f['concepts']],[125,A4[0]-213]),Spacer(1,15),text('Prioridade de estudo da sua equipe','HeadingStudy'),text(focus[i]),text('Não confunda as medidas','HeadingStudy'),text('Resultado clínico: mudança na condição de saúde, como ocorrência de lesão por pressão. Resultado de serviço: qualidade ou funcionamento da assistência. Desfecho de implementação: incorporação da prática. Eles podem se relacionar, mas um não comprova os demais nem estabelece, sozinho, causalidade.'),text('Base: Proctor et al., 2011 e 2023.','SmallStudy'),PageBreak()])
 story.extend([text('Retome a discussão','TitleStudy'),text('O contexto mudou','HeadingStudy'),text(c['event']),text('Perguntas para revisar seu raciocínio','HeadingStudy')])
 for q in c['review']:story.append(text('• '+q))
 story.extend([text('• Qual dado sustentou a escolha? Que nova evidência faria você revisar o plano?'),text('• Distinguiu determinante, estratégia e desfecho? Descreva um exemplo da missão.'),text('• Como preservou os componentes essenciais e adaptou o fluxo ao contexto?'),text('Anotações após a discussão','HeadingStudy'),text('Registre a estratégia escolhida, uma limitação apontada na discussão, um indicador completo e o próximo passo. Retome também a devolutiva da mediação no diário do jogo.'),text('Este resumo apresenta o caso e os conceitos; não reproduz automaticamente as decisões ou devolutivas digitadas na partida.','SmallStudy'),Spacer(1,10),text('Meu próximo passo: _________________________________________________'),text('Evidência que ainda preciso buscar: __________________________________'),text('Indicador e critério de revisão: _______________________________________'),PageBreak(),text('Textos-base e localizadores','TitleStudy')])
 for f in data['frameworkTopics']:
  for source in f['source']:
   ref=next(r for r in data['references'] if r['url']==source['url'])
   story.append(KeepTogether([p('<b>'+esc(source['label'])+'</b>. '+esc(ref['title'])+'. '+esc(ref['journal']),'SmallStudy'),text('Localizador: '+source['where'],'SmallStudy'),p('<link href="'+esc(source['url'])+'" color="#207766">'+esc(source['url'])+'</link>','SmallStudy')]))
 story.append(text('Material preparado com auxílio de inteligência artificial. A leitura das fontes e a análise acadêmica permanecem com docentes e discentes.','SmallStudy'))
 file=root/'public/hospital-preview'/('resumo-'+slugs[i]+'.pdf')
 doc=SimpleDocTemplate(str(file),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=43,bottomMargin=58,title='Resumo de estudo — '+actor['name'],author='Hospital Horizonte | Seminário do Grupo 5')
 doc.build(story,onFirstPage=footer,onLaterPages=footer)
 print(file)
