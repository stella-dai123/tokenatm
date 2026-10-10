// Weekly meal planning uses the same private account state and sync as the wallet.
const builtInMenuFoods = [
  ['rice','熟米饭','100g',130],['oats','干燕麦','40g',152],['egg','鸡蛋','1个（约50g）',78],
  ['chicken','熟去皮鸡胸肉','100g',165],['salmon','熟三文鱼','100g',206],['tofu','豆腐','100g',80],
  ['milk','全脂牛奶','100ml',61],['yogurt','原味无糖酸奶','100g',61],['banana','香蕉（可食部分）','100g',89],
  ['apple','苹果（可食部分）','100g',52],['broccoli','熟西兰花（无油）','100g',35],['oil','食用油','10g',90],
].map(([id,name,unit,calories])=>({id:'builtin-'+id,name,unit,calories,category:['rice','oats'].includes(id)?'主食':['egg','chicken','salmon','tofu'].includes(id)?'蛋白质':id==='broccoli'?'蔬菜':['apple','banana'].includes(id)?'水果':['milk','yogurt'].includes(id)?'饮品 / 乳制品':'油脂 / 配料'}));
const MENU_DAILY_CAP=1200;
const menuWeekLabels=['周一','周二','周三','周四','周五','周六','周日'];
const menuState=()=>state.menuPlanner||{foods:[],weeks:[],days:[]};
const menuCatalog=()=>[...builtInMenuFoods,...menuState().foods];
function menuAddDays(date,offset){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
function menuWeekday(date){return (new Date(date+'T12:00:00Z').getUTCDay()+6)%7+1}
function menuWeekStart(date){return menuAddDays(date,1-menuWeekday(date))}
let selectedMenuWeek=menuWeekStart(day()),selectedMenuDate=day();
const menuWeek=()=>menuState().weeks.find(w=>w.week===selectedMenuWeek)||{week:selectedMenuWeek,plans:[],rewardMode:'day',rewardPoints:20};
const menuCapCalories=plan=>Math.round(plan.foods.reduce((total,f)=>total+f.calories*f.quantity,0)*100)/100;
const menuCapTotal=plans=>Math.round(plans.reduce((n,p)=>n+menuCapCalories(p),0)*100)/100;
const menuCalories=plan=>Math.round(plan.foods.reduce((total,f)=>total+f.calories*f.quantity,0));
const menuFoodText=plan=>plan.foods.map(f=>f.name+' '+f.quantity+' × '+f.unit).join('、');
const menuRewardClaimed=date=>state.transactions.some(t=>t.menuRewardKey==='menu-day:'+date||(t.taskId==='t5'&&t.day===date));
function menuDisplayedDay(){const week=menuWeek(),saved=menuState().days.find(d=>d.date===selectedMenuDate);return saved||{date:selectedMenuDate,week:selectedMenuWeek,plans:week.plans.filter(p=>p.weekdays.includes(menuWeekday(selectedMenuDate))),doneIds:[],rewardMode:'day',rewardPoints:week.rewardPoints}}
function menuMatchesRecordedFood(daily){const meals=(state.meals||[]).filter(m=>m.day===daily.date&&m.type!=='运动');return daily.plans.length>0&&menuCapTotal(daily.plans)<=MENU_DAILY_CAP&&daily.plans.every(p=>daily.doneIds.includes(p.id)&&meals.some(m=>m.menuDate===daily.date&&m.menuPlanId===p.id&&m.type===p.type&&m.calories===menuCalories(p)&&m.name===menuFoodText(p)))&&meals.every(m=>daily.plans.some(p=>m.menuDate===daily.date&&m.menuPlanId===p.id&&m.type===p.type&&m.calories===menuCalories(p)&&m.name===menuFoodText(p)))}
function renderWeeklyMenu(){
  const week=menuWeek(),daily=menuDisplayedDay(),frozen=menuState().days.some(d=>d.date===selectedMenuDate),claimed=menuRewardClaimed(selectedMenuDate);
  const isToday=selectedMenuDate===day(),allDone=menuMatchesRecordedFood(daily),checked=daily.plans.length>0&&daily.plans.every(p=>daily.doneIds.includes(p.id));
  const total=menuCapTotal(daily.plans);
  $('#content').innerHTML=`<div id="weekly-menu"><div class="section-head"><div><h2>我的菜单 · 今天照着点。</h2><span class="muted">按整天安排，不分餐次 · 蛋白质可多选，其他类别最多一种</span></div><button class="outline" id="menu-plan-add">＋ 安排一天</button></div><div class="menu-week-toolbar"><button class="outline" data-menu-week="-1" aria-label="上一周">‹</button><div><b>${selectedMenuWeek} — ${menuAddDays(selectedMenuWeek,6)}</b><span class="muted">所选周</span></div><button class="outline" data-menu-week="1" aria-label="下一周">›</button><button class="outline" id="menu-this-week">回到本周</button><label for="menu-week-date" class="muted">选择周</label><input id="menu-week-date" type="date" value="${selectedMenuWeek}" aria-label="选择食谱周"></div><form id="menu-repeat-form" class="menu-repeat card"><div><h3>这个食谱，连续用几周？</h3><p class="muted">复制所选周的星期、食物、份量与奖励设置。各周之后可以单独修改。</p></div><div class="menu-repeat-controls"><label for="menu-repeat-weeks">总周数（含所选周）</label><div><input id="menu-repeat-weeks" type="number" min="2" max="52" step="1" value="4" required><button class="outline" ${!week.plans.length?'disabled':''}>重复食谱</button></div><p id="menu-repeat-preview" class="muted" aria-live="polite"></p></div></form><div class="menu-days">${menuWeekLabels.map((label,i)=>{const date=menuAddDays(selectedMenuWeek,i),hasPlan=week.plans.some(p=>p.weekdays.includes(i+1))||menuState().days.some(d=>d.date===date&&d.plans.length);return `<button data-menu-date="${date}" class="menu-day ${date===selectedMenuDate?'active':''}"><b>${label}</b><span>${date.slice(5)}</span><small>${hasPlan?'已安排':'未安排'}</small></button>`}).join('')}</div><div class="menu-summary"><div><span class="muted">${selectedMenuDate} · 全天计划摄入</span><b id="menu-total">${total} <small>kcal</small></b><span class="muted">每日上限1200 kcal · 剩余 ${Math.max(0,MENU_DAILY_CAP-total)} kcal</span></div><div><span class="muted">当天食谱完成</span><b>${checked?'已完成 ✓':'待完成'}</b></div><div><span class="muted">当日完成奖励</span><b>+${daily.rewardPoints} <small>tokens</small></b><button class="primary" id="menu-claim" ${!isToday||!allDone||claimed?'disabled':''}>${claimed?'今日奖励已领取 ✓':'领取当天奖励'}</button></div></div>${isToday&&checked&&!allDone?'<p class="muted">饮食记录与菜单一致且没有菜单外食物时，才可领取奖励。</p>':''}${!isToday?'<p class="muted">过去和未来的安排可查看；仅当天可以确认实际完成并领取奖励。</p>':''}${frozen?'<p class="muted">当天首次打卡时已保留食谱快照，后续修改或重复周计划不会改变当天确认的内容。</p>':''}<div class="menu-meals">${daily.plans.length?`<article class="card menu-meal"><div class="card-top"><h3>全天食谱</h3><span class="tokens">${total} kcal</span></div><ul class="menu-food-list">${daily.plans.flatMap(p=>p.foods).map(f=>`<li><span>${esc(f.name)}<small>${f.quantity} × ${esc(f.unit)}</small></span><b>${Math.round(f.calories*f.quantity*100)/100} kcal</b></li>`).join('')}</ul><label class="menu-done"><input type="checkbox" data-menu-day-done ${checked?'checked':''} ${!isToday||claimed?'disabled':''}><span>我今天已按这些食物与份量完成</span></label>${!frozen?'<div class="menu-plan-actions"><button class="danger" data-menu-edit-day>编辑当天食谱</button><button class="danger" data-menu-remove-day>删除这天的安排</button></div>':''}</article>`:'<div class="study-empty">这一天还没有食谱。点击「安排一天」，可一次选择周一、周三、周五等多个日期，再将整周食谱重复几周。</div>'}</div><section class="menu-settings card"><div><h3>我的食物与奖励</h3><p>按主食、蛋白质等类别保存你的食物，选单可反复使用。内置数值是参考估算，烹调和品牌会有差异；自定义可按包装标签填写，油和酱料可单独添加。</p><button class="outline" id="menu-food-add">＋ 自定义食物 / 每份热量</button></div><form id="menu-reward-form"><label for="menu-reward">这周每天按全天食谱完成，奖励多少 Token？</label><div class="menu-reward-input"><input id="menu-reward" type="number" min="1" max="10000" step="1" value="${week.rewardPoints}" required><button class="outline">保存奖励</button></div><p class="muted">奖励基于你确认按食谱完成，不按吃得少奖励。每天只领取一次。</p></form></section></div>`;
  $('#menu-plan-add').onclick=()=>openMenuPlanEditor();$('#menu-food-add').onclick=()=>openMenuFoodEditor();
  $('#menu-week-date').onchange=e=>{if(validCourseDate(e.target.value)){selectedMenuWeek=menuWeekStart(e.target.value);selectedMenuDate=e.target.value;renderWeeklyMenu()}};
  $('#weekly-menu').onclick=handleMenuClick;$('#weekly-menu').onchange=handleMenuDone;
  const repeatInput=$('#menu-repeat-weeks');repeatInput.oninput=()=>{const count=Number(repeatInput.value);$('#menu-repeat-preview').textContent=Number.isInteger(count)&&count>=2&&count<=52?'共 '+count+' 周，至 '+menuAddDays(selectedMenuWeek,count*7-1)+'；会新增 '+(count-1)+' 周。':'请选择 2–52 周。'};repeatInput.oninput();
  $('#menu-repeat-form').onsubmit=e=>{e.preventDefault();repeatMenuWeeks(Number(repeatInput.value))};
  $('#menu-reward-form').onsubmit=e=>{e.preventDefault();const rewardPoints=Number($('#menu-reward').value);if(!Number.isInteger(rewardPoints)||rewardPoints<1||rewardPoints>10000)return;const m=menuState(),next={...menuWeek(),rewardPoints};if(commit({...state,menuPlanner:{...m,weeks:[...m.weeks.filter(w=>w.week!==selectedMenuWeek),next]}}))toast('本周奖励已保存；已开始打卡的日期保留原奖励')};
}
function repeatMenuWeeks(count){
  if(!Number.isInteger(count)||count<2||count>52){toast('请选择 2–52 周（包含所选周）');return}
  const m=menuState(),source=menuWeek();if(!source.plans.length){toast('先安排本周食谱，再重复几周');return}
  if(!source.plans.every(validMenuPlan)||menuWeekLabels.some((_,i)=>menuCapTotal(source.plans.filter(p=>p.weekdays.includes(i+1)))>MENU_DAILY_CAP)){toast('本周有日期超过1200 kcal，请先调整食谱');return}
  const dates=Array.from({length:count-1},(_,i)=>menuAddDays(source.week,(i+1)*7));
  const existing=m.weeks.filter(w=>dates.includes(w.week)&&w.plans.length);
  const message='将 '+source.week+' 这一周的食谱重复使用 '+count+' 周，至 '+menuAddDays(source.week,count*7-1)+'。'+(existing.length?'\n以下周已有食谱，确认后会替换：\n'+existing.map(w=>w.week+' — '+menuAddDays(w.week,6)).join('\n'):'\n会添加接下来的 '+(count-1)+' 周食谱。')+'\n已打卡的记录和已领取的 Token 保持原样。是否继续？';
  if(!confirm(message))return;
  const copies=dates.map(week=>({...JSON.parse(JSON.stringify(source)),week,plans:source.plans.map(p=>({...JSON.parse(JSON.stringify(p)),id:crypto.randomUUID()}))}));
  if(commit({...state,menuPlanner:{...m,weeks:[...m.weeks.filter(w=>!dates.includes(w.week)),...copies]}}))toast('食谱已设为连续 '+count+' 周；之后每周可单独修改');
}
function handleMenuClick(event){const button=event.target.closest('button');if(!button)return;const d=button.dataset;
  if(d.menuWeek){const offset=Number(d.menuWeek)*7;selectedMenuWeek=menuAddDays(selectedMenuWeek,offset);selectedMenuDate=menuAddDays(selectedMenuDate,offset);renderWeeklyMenu();return}
  if(button.id==='menu-this-week'){selectedMenuWeek=menuWeekStart(day());selectedMenuDate=day();renderWeeklyMenu();return}
  if(d.menuDate){selectedMenuDate=d.menuDate;renderWeeklyMenu();return}
  if(button.hasAttribute('data-menu-edit-day')){openMenuPlanEditor(true);return}
  if(button.hasAttribute('data-menu-remove-day')&&confirm('删除这天的整天食谱？其他日期和已打卡的记录保持原样。')){const m=menuState(),weekday=menuWeekday(selectedMenuDate),w={...menuWeek(),plans:menuWeek().plans.map(p=>({...p,weekdays:p.weekdays.filter(d=>d!==weekday)})).filter(p=>p.weekdays.length)};commit({...state,menuPlanner:{...m,weeks:[...m.weeks.filter(x=>x.week!==w.week),w]}});return}
  if(button.id==='menu-claim')claimMenuReward();
}
function handleMenuDone(event){const input=event.target;if(!input.hasAttribute('data-menu-day-done'))return;
  if(selectedMenuDate!==day()||menuRewardClaimed(selectedMenuDate)){renderWeeklyMenu();return}
  const current=menuDisplayedDay();if(!current.plans.length)return;
  if(input.checked&&!confirm('确认今天已按以下全部食物与份量完成？\n'+current.plans.map(menuFoodText).join('；'))){input.checked=false;return}
  const checked=input.checked,m=menuState(),snapshot=JSON.parse(JSON.stringify(current)),ids=current.plans.map(p=>p.id);
  snapshot.doneIds=checked?ids:[];
  const meals=(state.meals||[]).filter(x=>!(x.menuDate===current.date&&ids.includes(x.menuPlanId)));
  if(checked)current.plans.forEach(plan=>meals.push({id:crypto.randomUUID(),day:current.date,type:plan.type,name:menuFoodText(plan),calories:menuCalories(plan),menuDate:current.date,menuPlanId:plan.id}));
  if(!commit({...state,meals,menuPlanner:{...m,days:[...m.days.filter(d=>d.date!==current.date),snapshot]}}))input.checked=!checked;
}
function claimMenuReward(){const current=menuDisplayedDay();if(current.date!==day()||!current.plans.length||menuRewardClaimed(current.date)||!menuMatchesRecordedFood(current))return;
  const transaction={id:crypto.randomUUID(),name:'按全天食谱完成当天计划',amount:current.rewardPoints,date:new Date().toISOString(),day:current.date,menuRewardKey:'menu-day:'+current.date};
  if(commit({...state,transactions:[...state.transactions,transaction]}))toast('已存入 '+current.rewardPoints+' tokens，当天不可重复领取');
}
const menuPlanDialog=document.createElement('dialog');menuPlanDialog.id='menu-plan-editor';
menuPlanDialog.innerHTML=`<form id="menu-plan-form"><h2 id="menu-plan-title">安排全天食谱</h2><fieldset class="menu-weekdays"><legend>本周哪些天吃这些？（可多选）</legend>${menuWeekLabels.map((label,i)=>`<label><input type="checkbox" name="weekday" value="${i+1}">${label}</label>`).join('')}</fieldset><p class="muted">全天一起选，不分餐次。蛋白质可添加多种，其他类别最多一种。每份热量 × 份数自动计算；吃150g、每份100g时填1.5份。</p><div id="menu-food-rows"></div><div class="menu-editor-tools"><button type="button" class="outline" id="menu-protein-add">＋ 添加一种蛋白质</button><button type="button" class="outline" id="menu-editor-custom">自定义食物</button></div><p class="menu-calorie-preview">全天计划热量：<b id="menu-plan-calories">0</b> kcal<br><span id="menu-cap-warning" role="status"></span></p><div class="actions"><button type="button" class="outline" id="menu-plan-cancel">取消</button><button class="primary" id="menu-plan-save">保存食谱</button></div></form>`;document.body.appendChild(menuPlanDialog);
let menuRowCounter=0,menuEditorWeek=null,menuEditorOriginalPlanIds=[];
function menuFoodOptions(selected,category){return '<option value="">不选这一类</option>'+menuCatalog().filter(f=>(f.category||'其他')===category).map(f=>`<option value="${esc(f.id)}" ${f.id===selected?'selected':''}>${esc(f.name)} · ${f.calories} kcal / ${esc(f.unit)}</option>`).join('')}
function addMenuFoodRow(food=null,category='其他',removable=false){const row=document.createElement('div');row.className='menu-food-row';row.dataset.group=category;const n=++menuRowCounter;
  row.innerHTML=`<div><label for="menu-food-${n}">${esc(category)}${category==='蛋白质'?'（可多选）':'（最多一种）'}</label><select id="menu-food-${n}" class="menu-food-select"></select></div><div><label for="menu-quantity-${n}">份数</label><input id="menu-quantity-${n}" class="menu-quantity" type="number" min="0.01" max="100" step="0.01" value="${food?.quantity||1}"></div>${removable?'<button type="button" class="danger" aria-label="移除这项食物">移除</button>':''}`;
  row.menuFoodSnapshot=food?{...food,category}:null;row.querySelector('select').innerHTML=menuFoodOptions(food?.id,category);
  if(food&&!menuCatalog().some(f=>f.id===food.id)){const option=new Option(food.name+' · '+food.calories+' kcal / '+food.unit,food.id);row.querySelector('select').add(option);row.querySelector('select').value=food.id}
  row.querySelector('select').onchange=()=>{row.menuFoodSnapshot=null;updateMenuCalories()};row.querySelector('input').oninput=updateMenuCalories;if(removable)row.querySelector('button').onclick=()=>{row.remove();updateMenuCalories()};
  const nextGroup=[...$('#menu-food-rows').children].find(el=>menuFoodGroups.indexOf(el.dataset.group)>menuFoodGroups.indexOf(category));$('#menu-food-rows').insertBefore(row,nextGroup||null);updateMenuCalories();
}
function readMenuFoodRows(){return [...$('#menu-food-rows').children].map(row=>{const id=row.querySelector('select').value,f=row.menuFoodSnapshot?.id===id?row.menuFoodSnapshot:menuCatalog().find(x=>x.id===id);return f?{...f,category:row.dataset.group,quantity:Number(row.querySelector('input').value)}:null}).filter(Boolean)}
function updateMenuCalories(){const rows=readMenuFoodRows(),total=Math.round(rows.reduce((n,f)=>n+f.calories*(Number.isFinite(f.quantity)?f.quantity:0),0)*100)/100;$('#menu-plan-calories').textContent=total;
  const otherGroups=rows.filter(f=>f.category!=='蛋白质').map(f=>f.category),duplicateGroups=new Set(otherGroups).size!==otherGroups.length,duplicateFoods=new Set(rows.map(f=>f.id)).size!==rows.length;
  $('#menu-cap-warning').textContent=duplicateGroups?'旧食谱在同一类别有多种食物；除蛋白质外，请每类保留一种后保存。':duplicateFoods?'同一种食物只需选一次，请用份数调整数量。':total>MENU_DAILY_CAP?'全天最多可安排1200 kcal，当前超出 '+Math.round((total-MENU_DAILY_CAP)*100)/100+' kcal，请减少份数或调整食物。':'全天安排后剩余 '+Math.round((MENU_DAILY_CAP-total)*100)/100+' kcal（每日上限1200 kcal）';
  $('#menu-plan-save').disabled=total>MENU_DAILY_CAP||duplicateGroups||duplicateFoods;
}
function openMenuPlanEditor(edit=false){menuEditorWeek=selectedMenuWeek;const plans=edit?menuWeek().plans.filter(p=>p.weekdays.includes(menuWeekday(selectedMenuDate))):[];menuEditorOriginalPlanIds=plans.map(p=>p.id);
  $('#menu-plan-form').reset();$('#menu-plan-title').textContent=edit?'编辑全天食谱':'安排全天食谱';
  const weekdays=plans.length===1&&plans[0].type==='全天'?plans[0].weekdays:[menuWeekday(selectedMenuDate)];document.querySelectorAll('[name=weekday]').forEach(input=>input.checked=weekdays.includes(Number(input.value)));
  // Merge identical foods from old meal-based plans without discarding their quantities.
  const foods=[];plans.flatMap(p=>p.foods).forEach(f=>{const category=f.category||'其他',same=foods.find(x=>x.id===f.id&&x.calories===f.calories&&x.unit===f.unit&&x.name===f.name&&x.category===category&&x.quantity+f.quantity<=100);if(same)same.quantity+=f.quantity;else foods.push({...f,category})});
  $('#menu-food-rows').innerHTML='';menuFoodGroups.forEach(category=>{const group=foods.filter(f=>f.category===category);if(group.length)group.forEach((f,i)=>addMenuFoodRow(f,category,category==='蛋白质'||i>0));else addMenuFoodRow(null,category)});menuPlanDialog.showModal();
}
$('#menu-protein-add').onclick=()=>addMenuFoodRow(null,'蛋白质',true);$('#menu-editor-custom').onclick=()=>openMenuFoodEditor();$('#menu-plan-cancel').onclick=()=>menuPlanDialog.close();
$('#menu-plan-form').onsubmit=e=>{e.preventDefault();const m=menuState(),week=m.weeks.find(w=>w.week===menuEditorWeek)||{week:menuEditorWeek,plans:[],rewardMode:'day',rewardPoints:20};
  if(menuEditorOriginalPlanIds.some(id=>!week.plans.some(p=>p.id===id))){toast('该食谱已被另一设备修改，请关闭后重新打开');return}
  const weekdays=[...document.querySelectorAll('[name=weekday]:checked')].map(i=>Number(i.value)),plan={id:crypto.randomUUID(),type:'全天',weekdays,foods:readMenuFoodRows()};
  if(!weekdays.length){toast('请至少选择一天');return}if(!validMenuPlan(plan)){toast('请添加食物并填写有效份数；蛋白质可多选，其他类别最多一种，同一食物只选一次');return}
  if(menuCapCalories(plan)>MENU_DAILY_CAP){toast('全天计划热量超过1200 kcal，请调整食物与份数');return}
  const conflicting=week.plans.some(p=>!menuEditorOriginalPlanIds.includes(p.id)&&p.weekdays.some(d=>weekdays.includes(d)));
  if(conflicting&&!confirm('选中日期已有食谱，将替换这些日期的全天安排。已打卡日期保留原食谱。继续吗？'))return;
  const plans=week.plans.map(p=>({...p,weekdays:p.weekdays.filter(d=>!weekdays.includes(d))})).filter(p=>p.weekdays.length);plans.push(plan);
  if(commit({...state,menuPlanner:{...m,weeks:[...m.weeks.filter(w=>w.week!==menuEditorWeek),{...week,plans}]}})){menuPlanDialog.close();toast('全天食谱已保存，共安排 '+weekdays.length+' 天')}
};
const menuFoodDialog=document.createElement('dialog');menuFoodDialog.id='menu-food-editor';menuFoodDialog.innerHTML=`<form id="menu-food-form"><h2>自定义食物</h2><label for="menu-custom-category">食物类别</label><select id="menu-custom-category">${menuFoodGroups.map(g=>`<option>${g}</option>`).join('')}</select><label for="menu-custom-name">食物名称</label><input id="menu-custom-name" maxlength="100" required placeholder="例如：我常吃的酸奶"><label for="menu-custom-unit">一份是多少？</label><input id="menu-custom-unit" maxlength="40" required placeholder="例如：100g、1盒200g、1个"><label for="menu-custom-calories">每份热量（kcal）</label><input id="menu-custom-calories" type="number" min="0" max="10000" step="1" required><div class="actions"><button type="button" class="outline" id="menu-food-cancel">取消</button><button class="primary" type="submit">保存食物</button></div></form>`;document.body.appendChild(menuFoodDialog);
function openMenuFoodEditor(){$('#menu-food-form').reset();menuFoodDialog.showModal()}
$('#menu-food-cancel').onclick=()=>menuFoodDialog.close();$('#menu-food-form').onsubmit=e=>{e.preventDefault();const f={id:crypto.randomUUID(),name:$('#menu-custom-name').value.trim(),unit:$('#menu-custom-unit').value.trim(),calories:Number($('#menu-custom-calories').value),category:$('#menu-custom-category').value};if(!validMenuFood(f))return;const m=menuState();if(commit({...state,menuPlanner:{...m,foods:[...m.foods,f]}})){menuFoodDialog.close();if(menuPlanDialog.open){const rows=[...$('#menu-food-rows').children];rows.forEach(row=>{const select=row.querySelector('select'),value=select.value;select.innerHTML=menuFoodOptions(value,row.dataset.group);if(value&&!menuCatalog().some(food=>food.id===value)&&row.menuFoodSnapshot){select.add(new Option(row.menuFoodSnapshot.name,value));select.value=value}});let target=rows.find(row=>row.dataset.group===f.category&&!row.querySelector('select').value);if(!target&&f.category==='蛋白质'){addMenuFoodRow(null,'蛋白质',true);target=[...$('#menu-food-rows').children].find(row=>row.dataset.group===f.category&&!row.querySelector('select').value)}if(target){target.querySelector('select').value=f.id;target.menuFoodSnapshot=null;updateMenuCalories()}}toast('自定义食物已保存')}};
let lastMenuDay=day();setInterval(()=>{const today=day();if(today!==lastMenuDay){lastMenuDay=today;if(tab==='menu')renderWeeklyMenu()}},60000);

function openTodaysMenu(){mainTab='health';tab='menu';selectedMenuDate=day();selectedMenuWeek=menuWeekStart(day());render()}
function renderMenuTokenCard(){const points=menuState().days.find(d=>d.date===day())?.rewardPoints||menuState().weeks.find(w=>w.week===menuWeekStart(day()))?.rewardPoints||20;const card=document.createElement('article');card.className='card menu-wallet-task';card.innerHTML='<div><h3>规律吃饭 · 按每周食谱完成</h3><p>当天按全天食谱确认完成后领取，避免重复奖励。</p></div><div><b class="tokens">+'+points+' tokens</b> <button class="primary" id="wallet-menu-open">'+(menuRewardClaimed(day())?'今天已领取 ✓ · 查看食谱':'去完成今日食谱')+'</button></div>';$('#content').prepend(card);$('#wallet-menu-open').onclick=openTodaysMenu;}
if(tab==='tasks')renderMenuTokenCard();
