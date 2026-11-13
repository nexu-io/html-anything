import type { Language, TemplateId } from './types.ts';

export const languages = ['zh', 'en', 'ja', 'ko', 'fr', 'es', 'pt'] as const;
export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && languages.includes(value as Language);
}
export function resolveLanguage(value?: string): Language {
  if (!value) return 'zh';
  const base = value.toLowerCase().split(/[-_]/)[0];
  return isLanguage(base) ? base : 'en';
}
type Translation = {
  ui: { waiting: string; unavailable: string; loading: string; failed: string; blocked: string;
    preview: string; clone: string; back: string; player: string; sending: string; notSent: string;
    manual: string; draftLabel: string; numeric: string; welcomeLabel: string; listLabel: string };
  welcome: { heading: string; discovery: string; introduction: string; recommendations: string; draft: string };
  descriptions: Record<TemplateId, string>;
  prompt: { brief: string; instruction: string; template: string; id: string; requirements: string };
};
export const translations: Record<Language, Translation> = {
  zh: {
    ui: { waiting: '正在准备模板预览…', unavailable: '模板预览暂不可用，请在聊天中选择模板。', loading: '正在加载预览…',
      failed: '视频暂时无法播放，仍可选择此模板。', blocked: '点击放大预览后播放。', preview: '放大预览', clone: '复刻模板',
      back: '返回模板列表', player: '模板完整预览', sending: '正在填入…', notSent: '未能填入，可重试或复制下方提示词。',
      manual: '当前客户端暂不支持填入输入框，请复制下方提示词。', draftLabel: '模板创作提示词',
      numeric: '先预览，再点「复刻模板」补充你的要求。', welcomeLabel: 'OpenMotion 欢迎', listLabel: 'OpenMotion 模板' },
    welcome: { heading: '🎉 OpenMotion 安装好啦，右侧就是模板库！',
      introduction: '我是你的开源视频创作搭档，我有丰富的高水准视频模板，也支持从参考视频或一个灵感出发，和你一起创作精彩的视频。',
      discovery: '模板库支持搜索，也可以随意浏览，找到喜欢的点击「复刻模板」就能开始你的创作！',
      recommendations: '不想自己找？先看看我挑的这 3 个 👇',
      draft: '你可以点击下方卡片上的「复刻模板」，然后补充「我的要求」或添加附件，发送后就开始创作！' },
    descriptions: { 'product-promo': '从图标开场到多人协作，查看多场景动画与字幕编排。', 'nyt-graph': '报刊风格的动态图表，查看数据、标注与图形的节奏。', 'decision-tree': '逐步展开的决策树，查看节点、连线与分支动画。' },
    prompt: { brief: '创作要求', instruction: '请使用 OpenMotion 插件，基于选择的模板，结合我的要求和附件创作。默认保留主要动效与风格，并交付 HTML 和 MP4。', template: '指定模板', id: '模板 ID', requirements: '我的要求' },
  },
  en: {
    ui: { waiting: 'Preparing template previews…', unavailable: 'Template previews are unavailable. Choose a template in the chat.', loading: 'Loading preview…',
      failed: 'This video cannot play. You can still choose the template.', blocked: 'Open the larger preview to play.', preview: 'Enlarge preview', clone: 'Recreate template',
      back: 'Back to templates', player: 'Full template preview', sending: 'Adding to composer…', notSent: 'Not added. Retry or copy the prompt below.',
      manual: 'This client cannot fill the composer. Copy the prompt below.', draftLabel: 'Template creation prompt',
      numeric: 'Preview a template, then choose Recreate template to add your requirements.', welcomeLabel: 'OpenMotion welcome', listLabel: 'OpenMotion templates' },
    welcome: { heading: '🎉 OpenMotion is installed. Your template library is open on the right!',
      introduction: 'I am your open-source video creation partner. I have a rich collection of high-quality video templates, and I can also help you create a video from a reference or an idea.',
      discovery: 'Search or browse the template library. When you find one you like, choose Recreate template to start creating!',
      recommendations: 'Want a starting point? Try one of these three 👇',
      draft: 'Choose Recreate template on a card below, add your requirements or attachments, then send it to start creating!' },
    descriptions: { 'product-promo': 'From an opening icon to team collaboration, explore multi-scene animation and caption sequencing.', 'nyt-graph': 'Newspaper-style animated charts, with carefully paced data, annotations and graphics.', 'decision-tree': 'Explore a decision tree that unfolds through animated nodes, connections and branches.' },
    prompt: { brief: 'Creative brief', instruction: 'Use the OpenMotion plugin to create a video from the selected template, my requirements and attachments. Preserve the main animation and style by default, and deliver HTML and MP4.', template: 'Selected template', id: 'Template ID', requirements: 'My requirements' },
  },
  ja: {
    ui: { waiting: 'テンプレートのプレビューを準備中…', unavailable: 'プレビューを利用できません。チャットでテンプレートを選んでください。', loading: 'プレビューを読み込み中…',
      failed: '動画を再生できませんが、このテンプレートは選択できます。', blocked: '拡大プレビューを開いて再生してください。', preview: 'プレビューを拡大', clone: 'テンプレートを再現',
      back: 'テンプレート一覧に戻る', player: 'テンプレートの全編プレビュー', sending: '入力欄に追加中…', notSent: '追加できませんでした。再試行するか、下のプロンプトをコピーしてください。',
      manual: 'このクライアントでは入力欄に追加できません。下のプロンプトをコピーしてください。', draftLabel: 'テンプレート制作プロンプト',
      numeric: 'まずプレビューし、「テンプレートを再現」で要望を追加してください。', welcomeLabel: 'OpenMotion へようこそ', listLabel: 'OpenMotion テンプレート' },
    welcome: { heading: '🎉 OpenMotion のインストールが完了しました。右側にテンプレートライブラリがあります！',
      introduction: '私は、オープンソースの動画制作パートナーです。高品質な動画テンプレートを豊富に用意しています。参考動画やアイデアからも、一緒に動画を制作できます。',
      discovery: 'テンプレートライブラリは検索も自由な閲覧もできます。気に入ったものが見つかったら「テンプレートを再現」をクリックして制作を始めましょう！',
      recommendations: 'どれにするか迷ったら、まずはこの3つをどうぞ 👇',
      draft: '下のカードの「テンプレートを再現」をクリックし、「私の要望」を記入するかファイルを添付して送信すると、制作が始まります！' },
    descriptions: { 'product-promo': 'アイコンでのオープニングからチームでの共同作業まで、多彩なシーンのアニメーションと字幕構成を紹介します。', 'nyt-graph': '新聞風のアニメーショングラフで、データ、注釈、図形のリズムを表現します。', 'decision-tree': 'ノードや接続線、分岐が順に展開する決定木のアニメーションです。' },
    prompt: { brief: '制作依頼', instruction: 'OpenMotion プラグインを使い、選択したテンプレート、私の要望、添付ファイルをもとに動画を制作してください。特に指定がなければ主なアニメーションとスタイルを維持し、HTML と MP4 を納品してください。', template: '選択したテンプレート', id: 'テンプレート ID', requirements: '私の要望' },
  },
  ko: {
    ui: { waiting: '템플릿 미리보기를 준비하는 중…', unavailable: '템플릿 미리보기를 사용할 수 없습니다. 채팅에서 템플릿을 선택해 주세요.', loading: '미리보기를 불러오는 중…',
      failed: '영상을 재생할 수 없지만 이 템플릿을 선택할 수 있습니다.', blocked: '확대 미리보기를 열어 재생해 주세요.', preview: '미리보기 확대', clone: '템플릿 재현',
      back: '템플릿 목록으로 돌아가기', player: '템플릿 전체 미리보기', sending: '입력창에 추가하는 중…', notSent: '추가하지 못했습니다. 다시 시도하거나 아래 프롬프트를 복사해 주세요.',
      manual: '이 클라이언트에서는 입력창에 추가할 수 없습니다. 아래 프롬프트를 복사해 주세요.', draftLabel: '템플릿 제작 프롬프트',
      numeric: '먼저 미리 본 다음, 「템플릿 재현」을 눌러 요구 사항을 추가해 주세요.', welcomeLabel: 'OpenMotion에 오신 것을 환영합니다', listLabel: 'OpenMotion 템플릿' },
    welcome: { heading: '🎉 OpenMotion 설치가 완료되었습니다. 오른쪽에 템플릿 라이브러리가 있어요!',
      introduction: '저는 여러분의 오픈 소스 영상 제작 파트너입니다. 다양한 고품질 영상 템플릿을 갖추고 있으며, 참고 영상이나 아이디어를 바탕으로 함께 영상을 만들 수도 있어요.',
      discovery: '템플릿 라이브러리에서 검색하거나 자유롭게 둘러보세요. 마음에 드는 템플릿의 「템플릿 재현」을 누르면 제작을 시작할 수 있어요!',
      recommendations: '고르기 어렵다면 제가 추천하는 이 3가지를 먼저 살펴보세요 👇',
      draft: '아래 카드의 「템플릿 재현」을 누르고 「내 요구 사항」을 작성하거나 파일을 첨부한 뒤 전송하면 제작이 시작됩니다!' },
    descriptions: { 'product-promo': '아이콘으로 시작해 팀 협업으로 이어지는 다양한 장면의 애니메이션과 자막 구성을 살펴보세요.', 'nyt-graph': '신문 스타일의 애니메이션 차트로 데이터, 주석, 그래픽의 리듬을 표현합니다.', 'decision-tree': '노드, 연결선, 분기가 차례로 펼쳐지는 의사결정 트리 애니메이션입니다.' },
    prompt: { brief: '제작 요청', instruction: 'OpenMotion 플러그인을 사용해 선택한 템플릿, 내 요구 사항과 첨부 파일을 바탕으로 영상을 제작해 주세요. 별도 요청이 없으면 주요 애니메이션과 스타일을 유지하고 HTML과 MP4를 제공해 주세요.', template: '선택한 템플릿', id: '템플릿 ID', requirements: '내 요구 사항' },
  },
  fr: {
    ui: { waiting: 'Préparation des aperçus…', unavailable: 'Les aperçus sont indisponibles. Choisissez un modèle dans le chat.', loading: 'Chargement de l’aperçu…',
      failed: 'Cette vidéo ne peut pas être lue. Vous pouvez tout de même choisir ce modèle.', blocked: 'Ouvrez l’aperçu agrandi pour lancer la lecture.', preview: 'Agrandir l’aperçu', clone: 'Recréer le modèle',
      back: 'Retour aux modèles', player: 'Aperçu complet du modèle', sending: 'Ajout dans la zone de saisie…', notSent: 'Échec de l’ajout. Réessayez ou copiez la consigne ci-dessous.',
      manual: 'Ce client ne peut pas remplir la zone de saisie. Copiez la consigne ci-dessous.', draftLabel: 'Consigne de création',
      numeric: 'Prévisualisez un modèle, puis choisissez « Recréer le modèle » pour ajouter vos besoins.', welcomeLabel: 'Bienvenue dans OpenMotion', listLabel: 'Modèles OpenMotion' },
    welcome: { heading: '🎉 OpenMotion est installé. La bibliothèque de modèles est ouverte à droite !',
      introduction: 'Je suis votre partenaire de création vidéo open source. Je propose de nombreux modèles vidéo de qualité et peux aussi créer avec vous à partir d’une vidéo de référence ou d’une idée.',
      discovery: 'Recherchez un modèle ou parcourez librement la bibliothèque. Cliquez sur « Recréer le modèle » pour commencer votre création !',
      recommendations: 'Besoin d’inspiration ? Découvrez ces 3 modèles que j’ai choisis 👇',
      draft: 'Cliquez sur « Recréer le modèle » sur une carte ci-dessous, complétez « Mes besoins » ou ajoutez des fichiers, puis envoyez votre demande pour lancer la création !' },
    descriptions: { 'product-promo': 'D’une icône d’ouverture à la collaboration en équipe, découvrez des scènes animées et leur enchaînement de sous-titres.', 'nyt-graph': 'Des graphiques animés au style journalistique, rythmant données, annotations et formes.', 'decision-tree': 'Découvrez un arbre de décision dont les nœuds, les liens et les branches se déploient progressivement.' },
    prompt: { brief: 'Demande de création', instruction: 'Utilisez le plugin OpenMotion pour créer une vidéo à partir du modèle sélectionné, de mes besoins et des fichiers joints. Par défaut, conservez les animations principales et le style, puis livrez les fichiers HTML et MP4.', template: 'Modèle sélectionné', id: 'Identifiant du modèle', requirements: 'Mes besoins' },
  },
  es: {
    ui: { waiting: 'Preparando vistas previas…', unavailable: 'Las vistas previas no están disponibles. Elige una plantilla en el chat.', loading: 'Cargando vista previa…',
      failed: 'No se puede reproducir el vídeo, pero aún puedes elegir esta plantilla.', blocked: 'Abre la vista previa ampliada para reproducirlo.', preview: 'Ampliar vista previa', clone: 'Recrear plantilla',
      back: 'Volver a las plantillas', player: 'Vista previa completa de la plantilla', sending: 'Añadiendo al cuadro de texto…', notSent: 'No se pudo añadir. Reinténtalo o copia la instrucción de abajo.',
      manual: 'Este cliente no puede rellenar el cuadro de texto. Copia la instrucción de abajo.', draftLabel: 'Instrucción de creación',
      numeric: 'Previsualiza una plantilla y elige « Recrear plantilla » para añadir tus requisitos.', welcomeLabel: 'Te damos la bienvenida a OpenMotion', listLabel: 'Plantillas de OpenMotion' },
    welcome: { heading: '🎉 OpenMotion ya está instalado. ¡La biblioteca de plantillas está abierta a la derecha!',
      introduction: 'Soy tu compañero de creación de vídeos de código abierto. Tengo una amplia colección de plantillas de alta calidad y también puedo crear contigo a partir de un vídeo de referencia o una idea.',
      discovery: 'Busca una plantilla o explora la biblioteca a tu ritmo. ¡Haz clic en « Recrear plantilla » para empezar tu creación!',
      recommendations: '¿Necesitas inspiración? Mira estas 3 plantillas que he elegido 👇',
      draft: 'Haz clic en « Recrear plantilla » en una tarjeta, completa « Mis requisitos » o adjunta archivos y envía tu solicitud para empezar a crear.' },
    descriptions: { 'product-promo': 'Desde un icono inicial hasta la colaboración en equipo, descubre escenas animadas y la secuencia de sus subtítulos.', 'nyt-graph': 'Gráficos animados de estilo periodístico que combinan datos, anotaciones y formas con ritmo.', 'decision-tree': 'Explora un árbol de decisión cuyos nodos, conexiones y ramas se despliegan paso a paso.' },
    prompt: { brief: 'Solicitud de creación', instruction: 'Utiliza el plugin OpenMotion para crear un vídeo a partir de la plantilla seleccionada, mis requisitos y los archivos adjuntos. Por defecto, conserva las animaciones principales y el estilo, y entrega HTML y MP4.', template: 'Plantilla seleccionada', id: 'ID de la plantilla', requirements: 'Mis requisitos' },
  },
  pt: {
    ui: { waiting: 'Preparando prévias dos modelos…', unavailable: 'As prévias estão indisponíveis. Escolha um modelo no chat.', loading: 'Carregando prévia…',
      failed: 'Não é possível reproduzir este vídeo, mas você ainda pode escolher o modelo.', blocked: 'Abra a prévia ampliada para reproduzir.', preview: 'Ampliar prévia', clone: 'Recriar modelo',
      back: 'Voltar aos modelos', player: 'Prévia completa do modelo', sending: 'Adicionando à caixa de texto…', notSent: 'Não foi possível adicionar. Tente novamente ou copie a instrução abaixo.',
      manual: 'Este cliente não pode preencher a caixa de texto. Copie a instrução abaixo.', draftLabel: 'Instrução de criação',
      numeric: 'Veja a prévia e escolha « Recriar modelo » para adicionar seus requisitos.', welcomeLabel: 'Boas-vindas ao OpenMotion', listLabel: 'Modelos do OpenMotion' },
    welcome: { heading: '🎉 OpenMotion instalado. A biblioteca de modelos está aberta à direita!',
      introduction: 'Sou seu parceiro de criação de vídeos de código aberto. Tenho uma ampla coleção de modelos de alta qualidade e também posso criar com você a partir de um vídeo de referência ou de uma ideia.',
      discovery: 'Pesquise um modelo ou explore a biblioteca à vontade. Clique em « Recriar modelo » para começar sua criação!',
      recommendations: 'Precisa de inspiração? Veja estes 3 modelos que escolhi 👇',
      draft: 'Clique em « Recriar modelo » em um cartão, preencha « Meus requisitos » ou anexe arquivos e envie sua solicitação para começar a criar!' },
    descriptions: { 'product-promo': 'De um ícone de abertura à colaboração em equipe, explore cenas animadas e a sequência de suas legendas.', 'nyt-graph': 'Gráficos animados de estilo jornalístico, com ritmo entre dados, anotações e formas.', 'decision-tree': 'Explore uma árvore de decisão com nós, conexões e ramificações que se revelam passo a passo.' },
    prompt: { brief: 'Pedido de criação', instruction: 'Use o plugin OpenMotion para criar um vídeo com o modelo selecionado, meus requisitos e os arquivos anexados. Por padrão, preserve as animações principais e o estilo e entregue HTML e MP4.', template: 'Modelo selecionado', id: 'ID do modelo', requirements: 'Meus requisitos' },
  },
};
