// Hommy Baby 網站設定：要改 Email、價格、文案，改這個檔就好。
window.HOMMY = {
  // 訂單會寄到這個信箱（第一次收到 FormSubmit 的啟用信時要點確認）
  orderEmail: "hommybaby.studio@gmail.com",
  // 客人用 Interac e-Transfer 轉帳到這個信箱
  etransferEmail: "hommybaby.studio@gmail.com",
  // 測試模式：完成頁和確認信會寫「這是測試訂單，請不要付款」，寄給你的訂單標題加上 [TEST]。正式開賣時改成 false。
  testMode: true,

  paymentWindowHours: 48,
  // 下單後約幾天內出貨（網站上「ships within about N days」）
  shipsWithinDays: 3,
  deliveryNote: "Most parcels arrive 2–8 business days after they leave us.",

  // 手寫卡方案的限時標籤會顯示「Card free, limited time」；有截止日請填 offerEnds，例如 "until December 31"
  offerEnds: "",

  // 第一步的寶寶臉（images/face-XX.png）。客人挑「最像那個寶寶」的臉，訂單會記錄號碼。
  // trim 是預覽圍兜的滾邊：ruffle 荷葉邊、pompom 毛球，只影響畫面。
  // body 是預覽用的全身寶寶：pink 粉紅點點衣＝9199（淺膚色、小麥色的臉）、yellow 黃條紋衣＝9198（深膚色的臉）。
  // chin 是下巴在臉部圖檔中的高度，以圖寬為 1 計算（量自圖檔），用來讓換上的頭剛好接在脖子上。
  // pink 身體的手會依臉的膚色上色；新增或修改 pink 的臉之後，要重新產生手：見 README。
  faces: [
    { id: "01", trim: "pompom", body: "pink", chin: 1.031 },
    { id: "02", trim: "pompom", body: "pink", chin: 0.978 },
    { id: "03", trim: "pompom", body: "pink", chin: 1.009 },
    { id: "04", trim: "ruffle", body: "pink", chin: 1.009 },
    { id: "05", trim: "ruffle", body: "yellow", chin: 1.059 },
    { id: "06", trim: "pompom", body: "pink", chin: 1.028 },
    { id: "07", trim: "pompom", body: "yellow", chin: 1.044 },
    { id: "08", trim: "pompom", body: "pink", chin: 1.078 },
    { id: "09", trim: "ruffle", body: "yellow", chin: 1.012 },
    { id: "10", trim: "pompom", body: "pink", chin: 1.109 },
    { id: "11", trim: "pompom", body: "pink", chin: 1.044 },
    { id: "12", trim: "pompom", body: "pink", chin: 1.072 },
  ],

  stages: [
    {
      id: "newborn",
      label: "Newborn",
      contents: "Bib, pacifier clip and headband",
      price: 99,
      face: "images/face-10.png",
    },
    {
      id: "kindergarten",
      label: "Kindergarten",
      contents: "Cape and headband",
      price: 119,
      face: "images/face-01.png",
    },
  ],

  // 祝福色。name 是網站上顯示的名字（跟祝福語呼應，不直接說顏色）；colour 是實際顏色，只出現在寄給你的訂單通知，方便挑布料。
  // glow 取自 Radix Colors（light）第 8 階：amber、tomato、crimson、violet、sky、grass
  guardians: [
    {
      id: "morning-star",
      name: "First Light",
      colour: "Gold",
      blessing: "May hope lead the way, and may your life shine brightly.",
      glow: "#e2a336",
    },
    {
      id: "big-heart",
      name: "Big Heart",
      colour: "Red",
      blessing: "May you love the world with all your heart.",
      glow: "#ec8e7b",
    },
    {
      id: "rose-fairy",
      name: "Tender Heart",
      colour: "Pink",
      blessing: "May you be surrounded by love, and learn to love well.",
      glow: "#e093b2",
    },
    {
      id: "moon-keeper",
      name: "Moonlit Dreams",
      colour: "Lavender",
      blessing: "May your dreams be peaceful and your wisdom gentle.",
      glow: "#aa99ec",
    },
    {
      id: "sylph",
      name: "Open Sky",
      colour: "Blue",
      blessing: "May you be brave and free, and go wherever your heart calls.",
      glow: "#60b3d7",
    },
    {
      id: "oak-dryad",
      name: "Wide World",
      colour: "Green",
      blessing: "May the wide world be yours, and may you find joy in every place you go.",
      glow: "#65ba74",
    },
  ],

  // 方案頁「See real Hommy gifts」的實品照（images/gifts/）。stage 決定客人選了哪個方案時先看哪些。
  gifts: [
    { src: "images/gifts/gift-01.jpg", stage: "newborn" },
    { src: "images/gifts/gift-02.jpg", stage: "newborn" },
    { src: "images/gifts/gift-03.jpg", stage: "newborn" },
    { src: "images/gifts/gift-04.jpg", stage: "newborn" },
    { src: "images/gifts/gift-05.jpg", stage: "newborn" },
    { src: "images/gifts/gift-06.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-07.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-08.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-09.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-10.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-11.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-12.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-13.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-14.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-15.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-16.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-17.jpg", stage: "kindergarten" },
    { src: "images/gifts/gift-18.jpg", stage: "kindergarten" },
  ],

  plans: [
    {
      id: "letter",
      label: "Gift set with a hand-written card",
      short: "Hand-written card",
      detail: "We'll email you to confirm your words.",
      card: true,
    },
    {
      id: "set",
      label: "Gift set",
      short: "Gift set",
      detail: "With the blessing and maker's notes.",
      card: false,
    },
  ],
};
