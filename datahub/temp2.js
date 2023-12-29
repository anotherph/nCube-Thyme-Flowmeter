const retriData = {"m2m:cin":{"pi":"3-20231228064511699556","ri":"4-20231228074428245706","ty":4,"ct":"20231228T074428","st":43,"rn":"4-20231228074428245","lt":"20231228T074428","et":"20251228T074428","lvl":"4","loc":{"x":127.1,"y":37.4},"cs":102,"cr":"SKETI_Flowmeter","con":{"cur_time":"23-12-11 19:55:25","m_flowrate":"20.866Lt/m","m_speed":"1.96m/s","t_flowrate":"188.18Lt"}}};

const conData = retriData["m2m:cin"]["con"];

console.log(conData)