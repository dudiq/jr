
// var str = "Одежда, обувь\t\n" +
//     "\tаксесуары\n" +
//     "\tобувь\n" +
//     "\tодежда\n" +
//     "\t\n" +
//     "Питание\t\n" +
//     "\tкафе/ресторан\n" +
//     "\tперекус (пирожок)\n" +
//     "\tмагазин\n" +
//     "\tобед\n" +
//     "\t\n" +
//     "Разное\t\n" +
//     "\tпомощь\n" +
//     "\tподарки\n" +
//     "\tнезапланированое\n" +
//     "\t\n" +
//     "Путешествия\t\n" +
//     "\tтранспорт\n" +
//     "\tсувениры\n" +
//     "\tсвязь\n" +
//     "\tеда\n" +
//     "\t\n" +
//     "Личный транспорт\t\n" +
//     "\tбензин\n" +
//     "\tремонт\n" +
//     "\tстраховка\n" +
//     "\tТО\n" +
//     "\tштраф\n" +
//     "\tналог\n" +
//     "\tпарковка\n" +
//     "\tмойка\n" +
//     "\t\n" +
//     "Транспорт\t\n" +
//     "\tтакси\n" +
//     "\tпоезд\n" +
//     "\tсамолет\n" +
//     "\tобщественный\n" +
//     "\tкорабль\n" +
//     "\t\n" +
//     "Дом\t\n" +
//     "\tбыт. химия\n" +
//     "\tмебель\n" +
//     "\tпосуда\n" +
//     "\tремонт\n" +
//     "\tканц товары\n" +
//     "\t\n" +
//     "Счета и услуги\t\n" +
//     "\tипотека\n" +
//     "\tаренда\n" +
//     "\tкоммунальные платежи\n" +
//     "\tинет\n" +
//     "\tмоб связь\n" +
//     "\tстраховка имущества\n" +
//     "\tналог\n" +
//     "\tкредит\n" +
//     "\t\n" +
//     "Красота и уход\t\n" +
//     "\tкосметика\n" +
//     "\tпарикмахер\n" +
//     "\tмассаж\n" +
//     "\tтренировки\n" +
//     "\tпроцедуры\n" +
//     "\t\n" +
//     "Здоровье\t\n" +
//     "\tаптека\n" +
//     "\tбольница\n" +
//     "\tстрахование\n" +
//     "\t\n" +
//     "Дети\t\n" +
//     "\tигрушки\n" +
//     "\tсадик, школа, универ\n" +
//     "\t\n" +
//     "Образование\t\n" +
//     "\tкурсы, тренинги\n" +
//     "\tкниги, журналы\n" +
//     "\tВУЗ\n" +
//     "\t\n" +
//     "Хобби\t\n" +
//     "Развлечения\t";
// debugger;
// var lines = str.split("\n");
// var cats = [];
// var root = null;
// var map = {};
// for (var i = 0, l = lines.length; i < l; i++) {
//     var line = lines[i].trim();
//     if (!line) {
//         // it's root
//         root = null;
//     } else {
//         var nodeId = helper.mongoId();
//         if (map[nodeId]) {
//             console.error('fuck!');
//         }
//         map[nodeId] = true;
//         var node = {
//             id: nodeId,
//             title: line,
//             catId: root
//         };
//         if (!root) {
//             root = nodeId;
//         }
//         cats.push(node);
//     }
// }
