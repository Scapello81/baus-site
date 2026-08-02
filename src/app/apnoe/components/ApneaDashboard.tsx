"use client";
import { useEffect,useMemo,useRef,useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import styles from "../apnoe.module.css";
import type {PlanRound,PlanType,RecordRow,TrainingRow,TrainingType} from "../types";

const DEFAULTS:Record<PlanType,PlanRound[]>={co2:[
{hold:120,rest:120},{hold:120,rest:105},{hold:120,rest:90},{hold:120,rest:75},{hold:120,rest:60},{hold:120,rest:45},{hold:120,rest:30},{hold:120,rest:15},{hold:120,rest:0}],
o2:[{hold:90,rest:120},{hold:105,rest:120},{hold:120,rest:120},{hold:130,rest:120},{hold:140,rest:120},{hold:140,rest:0}]};
const fmt=(s:number)=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.max(0,s)%60).padStart(2,"0")}`;
const parse=(v:string)=>{const m=v.trim().match(/^(\d{1,2}):([0-5]\d)$/);return m?Number(m[1])*60+Number(m[2]):null};
const iso=(d=new Date())=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
const ru=(d:string)=>new Date(d+"T12:00:00").toLocaleDateString("ru-RU");

type Timer={mode:TrainingType;rounds:PlanRound[];index:number;phase:"hold"|"rest";total:number;remaining:number;running:boolean;actual:number[]};

export default function ApneaDashboard({userId,userEmail}:{userId:string;userEmail:string}){
 const supabase=useMemo(()=>createClient(),[]);
 const [plans,setPlans]=useState<Record<PlanType,PlanRound[]>>(DEFAULTS);
 const [records,setRecords]=useState<RecordRow[]>([]);
 const [trainings,setTrainings]=useState<TrainingRow[]>([]);
 const [active,setActive]=useState<PlanType>("co2");
 const [month,setMonth]=useState(new Date());
 const [timer,setTimer]=useState<Timer|null>(null);
 const [edit,setEdit]=useState(false);
 const [recordOpen,setRecordOpen]=useState(false);
 const [error,setError]=useState("");
 const tick=useRef<ReturnType<typeof setInterval>|null>(null);

 async function load(){
  setError("");
  const [p,r,t]=await Promise.all([
   supabase.from("apnea_plans").select("id,type,rounds"),
   supabase.from("apnea_records").select("*").order("record_date",{ascending:false}),
   supabase.from("apnea_trainings").select("*").order("training_date",{ascending:false})
  ]);
  const e=p.error||r.error||t.error;if(e){setError(e.message);return}
  const next={...DEFAULTS};
  for(const row of p.data??[])next[row.type as PlanType]=row.rounds as PlanRound[];
  for(const type of ["co2","o2"] as PlanType[])if(!(p.data??[]).some(x=>x.type===type))
   await supabase.from("apnea_plans").insert({user_id:userId,type,rounds:DEFAULTS[type]});
  let rec=(r.data??[]) as RecordRow[];
  if(!rec.length){
   const seed=await supabase.from("apnea_records").insert({user_id:userId,duration_seconds:158,record_date:"2026-08-01",first_urge_seconds:60,note:"Без гипервентиляции"}).select().single();
   if(seed.data)rec=[seed.data as RecordRow];
  }
  setPlans(next);setRecords(rec);setTrainings((t.data??[]) as TrainingRow[]);
 }
 useEffect(()=>{void load();return()=>{if(tick.current)clearInterval(tick.current)}},[]);
 const best=[...records].sort((a,b)=>b.duration_seconds-a.duration_seconds)[0];
 const monthBest=Math.max(0,...records.filter(x=>x.record_date.startsWith(iso().slice(0,7))).map(x=>x.duration_seconds));
 function begin(mode:TrainingType){
  const rounds=mode==="co2"||mode==="o2"?plans[mode]:[{hold:mode==="max"?600:120,rest:0}];
  setTimer({mode,rounds,index:0,phase:"hold",total:rounds[0].hold,remaining:rounds[0].hold,running:false,actual:[]});
 }
 function advance(cur:Timer,elapsed?:number):Timer|null{
  let n={...cur};
  if(cur.phase==="hold"){n.actual=[...cur.actual,(elapsed??cur.total)];const rest=cur.rounds[cur.index].rest;if(rest>0)return {...n,phase:"rest",total:rest,remaining:rest}}
  const idx=cur.index+1;
  if(idx>=cur.rounds.length){if(tick.current)clearInterval(tick.current);tick.current=null;void saveTraining(n);return null}
  return {...n,index:idx,phase:"hold",total:cur.rounds[idx].hold,remaining:cur.rounds[idx].hold}
 }
 function toggle(){
  if(!timer)return;
  if(timer.running){if(tick.current)clearInterval(tick.current);tick.current=null;setTimer({...timer,running:false});return}
  setTimer({...timer,running:true});
  tick.current=setInterval(()=>setTimer(cur=>!cur?cur:cur.remaining>1?{...cur,remaining:cur.remaining-1}:advance(cur,cur.total)),1000);
 }
 async function saveTraining(cur:Timer){
  const res=await supabase.from("apnea_trainings").insert({user_id:userId,training_date:iso(),type:cur.mode,planned_rounds:cur.rounds,actual_rounds:cur.actual,completed_rounds:cur.actual.length,total_rounds:cur.rounds.length}).select().single();
  if(res.error){setError(res.error.message);return}
  setTrainings(x=>[res.data as TrainingRow,...x]);
  if(cur.mode==="max"&&cur.actual[0])await addRecord(cur.actual[0],iso(),null,null,"Записано таймером");
 }
 async function addRecord(seconds:number,date:string,urge:number|null,contract:number|null,note:string){
  const res=await supabase.from("apnea_records").insert({user_id:userId,duration_seconds:seconds,record_date:date,first_urge_seconds:urge,first_contraction_seconds:contract,note:note||null}).select().single();
  if(res.error){setError(res.error.message);return false}
  setRecords(x=>[res.data as RecordRow,...x]);return true;
 }
 async function savePlan(rounds:PlanRound[]){
  const res=await supabase.from("apnea_plans").upsert({user_id:userId,type:active,rounds,updated_at:new Date().toISOString()},{onConflict:"user_id,type"});
  if(res.error){setError(res.error.message);return false}setPlans(x=>({...x,[active]:rounds}));return true;
 }
 const cells=useMemo(()=>{const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),off=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prev=new Date(y,m,0).getDate();
  return Array.from({length:42},(_,i)=>{let d:Date,other=false;if(i<off){d=new Date(y,m-1,prev-off+i+1);other=true}else if(i>=off+days){d=new Date(y,m+1,i-off-days+1);other=true}else d=new Date(y,m,i-off+1);return{d,date:iso(d),other}})},[month]);
 async function mark(date:string){const raw=prompt("Тип: co2, o2, max, free, light или water","co2");if(!raw||!["co2","o2","max","free","light","water"].includes(raw))return;
  const res=await supabase.from("apnea_trainings").insert({user_id:userId,training_date:date,type:raw,completed_rounds:0,total_rounds:0,note:"Добавлено вручную"}).select().single();
  if(res.data)setTrainings(x=>[res.data as TrainingRow,...x]);if(res.error)setError(res.error.message);
 }
 return <main className={styles.page}><div className={styles.shell}>
  <header className={styles.top}><div><span className={styles.eyebrow}>BAUS Training</span><h1 className={styles.title}>Статическое апноэ</h1><p className={styles.muted}>{userEmail}</p></div><button className={styles.secondary} onClick={()=>void load()}>Обновить</button></header>
  {error&&<p className={styles.error}>{error}</p>}
  <section className={`${styles.card} ${styles.hero}`}><div><span className={styles.eyebrow}>Текущий рекорд</span><div className={styles.record}>{best?fmt(best.duration_seconds):"—"}</div><p className={styles.muted}>{best?ru(best.record_date):"Нет результата"}</p></div>
   <div className={styles.buttons}><button className={styles.btn} onClick={()=>begin("co2")}>CO₂-тренировка</button><button className={styles.btn} onClick={()=>begin("o2")}>O₂-тренировка</button><button className={styles.danger} onClick={()=>begin("max")}>Максимум</button><button className={styles.secondary} onClick={()=>begin("free")}>Свободный таймер</button></div></section>
  <section className={styles.grid}><article className={styles.card}><div className={styles.head}><div><span className={styles.eyebrow}>План</span><h2>{active.toUpperCase()}-таблица</h2></div><div><button className={styles.secondary} onClick={()=>setActive(active==="co2"?"o2":"co2")}>{active==="co2"?"O₂":"CO₂"}</button> <button className={styles.secondary} onClick={()=>setEdit(true)}>Изменить</button></div></div><div className={styles.rows}>{plans[active].map((r,i)=><div className={styles.row} key={i}><span>Раунд {i+1}</span><b>{fmt(r.hold)} / {fmt(r.rest)}</b></div>)}</div></article>
   <article className={styles.card}><span className={styles.eyebrow}>Цель</span><h2>3:00</h2><div className={styles.progress}><span style={{width:`${Math.min(100,((best?.duration_seconds??0)/180)*100)}%`}}/></div><p className={styles.muted}>Осталось {Math.max(0,180-(best?.duration_seconds??0))} секунд</p><div className={styles.stats}><div className={styles.stat}><strong>{trainings.length}</strong><span className={styles.muted}>тренировок</span></div><div className={styles.stat}><strong>{monthBest?fmt(monthBest):"—"}</strong><span className={styles.muted}>лучшее за месяц</span></div><div className={styles.stat}><strong>{records.length}</strong><span className={styles.muted}>результатов</span></div></div></article></section>
  <section className={styles.card}><div className={styles.head}><div><span className={styles.eyebrow}>Календарь</span><h2>{month.toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</h2></div><div><button className={styles.secondary} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}>←</button> <button className={styles.secondary} onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}>→</button></div></div><div className={styles.week}>{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map(x=><span key={x}>{x}</span>)}</div><div className={styles.calendar}>{cells.map(c=><button key={c.date} className={`${styles.day} ${c.date===iso()?styles.today:""} ${c.other?styles.other:""}`} onClick={()=>void mark(c.date)}><b>{c.d.getDate()}</b><div>{trainings.filter(t=>t.training_date===c.date).map(t=><span className={styles.tag} key={t.id}>{t.type.toUpperCase()}</span>)}</div></button>)}</div></section>
  <section className={styles.grid}><article className={styles.card}><div className={styles.head}><h2>История рекордов</h2><button className={styles.secondary} onClick={()=>setRecordOpen(true)}>Добавить</button></div><div className={styles.rows}>{records.slice(0,10).map(r=><div className={styles.row} key={r.id}><div><b>{fmt(r.duration_seconds)}</b><div className={styles.muted}>{ru(r.record_date)}{r.first_urge_seconds?` · позыв ${fmt(r.first_urge_seconds)}`:""}</div></div><span className={styles.tag}>MAX</span></div>)}</div></article>
   <article className={styles.card}><h2>Последние тренировки</h2><div className={styles.rows}>{trainings.slice(0,10).map(t=><div className={styles.row} key={t.id}><div><b>{t.type.toUpperCase()}</b><div className={styles.muted}>{ru(t.training_date)} · {t.completed_rounds}/{t.total_rounds}</div></div><span className={styles.tag}>{t.type.toUpperCase()}</span></div>)}</div></article></section>
 </div>
 {timer&&<div className={styles.overlay}><div className={styles.timerBox}><span className={styles.eyebrow}>{timer.mode.toUpperCase()}</span><h2>{timer.phase==="hold"?"Задержка":"Отдых"}</h2><div className={styles.timer}>{fmt(timer.remaining)}</div><p className={styles.muted}>Раунд {timer.index+1} из {timer.rounds.length}</p><div className={styles.progress}><span style={{width:`${((timer.total-timer.remaining)/Math.max(1,timer.total))*100}%`}}/></div><div className={styles.controls}><button className={styles.btn} onClick={toggle}>{timer.running?"Пауза":"Старт"}</button><button className={styles.secondary} onClick={()=>setTimer(cur=>!cur?cur:advance(cur,Math.max(1,cur.total-cur.remaining)))}>Завершить этап</button><button className={styles.secondary} onClick={()=>{if(tick.current)clearInterval(tick.current);tick.current=null;setTimer(null)}}>Закрыть</button></div><p className={styles.muted}>Без гипервентиляции. В воде — только с напарником.</p></div></div>}
 {edit&&<PlanEditor rounds={plans[active]} onClose={()=>setEdit(false)} onSave={async r=>{if(await savePlan(r))setEdit(false)}}/>}
 {recordOpen&&<RecordModal onClose={()=>setRecordOpen(false)} onSave={async(...args)=>{if(await addRecord(...args))setRecordOpen(false)}}/>}
 </main>
}
function PlanEditor({rounds,onClose,onSave}:{rounds:PlanRound[];onClose:()=>void;onSave:(r:PlanRound[])=>Promise<void>}){
 const [draft,setDraft]=useState(rounds.map(r=>({hold:fmt(r.hold),rest:fmt(r.rest)})));const [msg,setMsg]=useState("");
 async function submit(){const p=draft.map(r=>({hold:parse(r.hold),rest:parse(r.rest)}));if(p.some(r=>r.hold===null||r.rest===null)){setMsg("Формат времени: М:СС");return}await onSave(p.map(r=>({hold:r.hold!,rest:r.rest!})))}
 return <div className={styles.modalWrap}><div className={styles.modal}><div className={styles.head}><h2>Редактор плана</h2><button className={styles.secondary} onClick={onClose}>Закрыть</button></div>{draft.map((r,i)=><div className={styles.edit} key={i}><input value={r.hold} onChange={e=>setDraft(x=>x.map((v,j)=>j===i?{...v,hold:e.target.value}:v))}/><input value={r.rest} onChange={e=>setDraft(x=>x.map((v,j)=>j===i?{...v,rest:e.target.value}:v))}/><button className={styles.secondary} onClick={()=>setDraft(x=>x.filter((_,j)=>j!==i))}>Удалить</button></div>)}{msg&&<p className={styles.error}>{msg}</p>}<div className={styles.controls}><button className={styles.secondary} onClick={()=>setDraft(x=>[...x,{hold:"2:00",rest:"1:00"}])}>Добавить раунд</button><button className={styles.btn} onClick={()=>void submit()}>Сохранить</button></div></div></div>
}
function RecordModal({onClose,onSave}:{onClose:()=>void;onSave:(s:number,d:string,u:number|null,c:number|null,n:string)=>Promise<void>}){
 const [date,setDate]=useState(iso()),[time,setTime]=useState("2:38"),[urge,setUrge]=useState("1:00"),[con,setCon]=useState(""),[note,setNote]=useState(""),[msg,setMsg]=useState("");
 async function submit(){const s=parse(time),u=urge?parse(urge):null,c=con?parse(con):null;if(s===null||(urge&&u===null)||(con&&c===null)){setMsg("Формат времени: М:СС");return}await onSave(s,date,u,c,note)}
 return <div className={styles.modalWrap}><div className={styles.modal}><div className={styles.head}><h2>Новый результат</h2><button className={styles.secondary} onClick={onClose}>Закрыть</button></div><div className={styles.form}><label>Дата<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><label>Время<input value={time} onChange={e=>setTime(e.target.value)}/></label><label>Первый позыв<input value={urge} onChange={e=>setUrge(e.target.value)}/></label><label>Контракции<input value={con} onChange={e=>setCon(e.target.value)} placeholder="Необязательно"/></label><label>Комментарий<textarea value={note} onChange={e=>setNote(e.target.value)}/></label></div>{msg&&<p className={styles.error}>{msg}</p>}<div className={styles.controls}><button className={styles.btn} onClick={()=>void submit()}>Сохранить</button></div></div></div>
}
