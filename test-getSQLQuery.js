const { getSQLQuery } = require('./controllers/openAIController');

(async () => {
  const data ={
    "q": "EVENTS in SAT",
    "csv": [
        {
            "name": "events - events.csv",
            "content": "Row ID,LOCATION,LAT,LNG,DAY,HOUR,GENRE,NAME,EVENT,DURATION,EMAIL,PHONE,IMAGE,VIDEO,LINK\r\noce1c5S4Fq4ZevZ-maHUIe,הדגניות 43,32.7206538,35.1248909,חמישי,22:30,פרפורמנס,טל ארנון,שרים על המקום,90,ipadtal@gmail.com,\"542,804,003\",,,\r\nB77uC994C9b4GjTXFvzS9j,פיש 13,32.705537,35.121476,שבת,20:30,מוזיקה,טל,חזרה,,telem.yael@gmail.com,,,,"
        }
    ]
}
  try {
    const result = await getSQLQuery(data);
    console.log('getSQLQuery result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
})();
