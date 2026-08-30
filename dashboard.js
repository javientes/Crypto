const bron=window.DASHBOARD_DATA||{};

const data=bron.data||[];
const kolomLNaam=bron.kolomLNaam||"";
const wmtxGekocht=Number(bron.wmtxGekocht)||0;
const wmtxStaking=Number(bron.wmtxStaking)||0;
const wmtxTotaal=Number(bron.wmtxTotaal)||0;

const el=id=>document.getElementById(id);
const n=x=>Number(x)||0;
const som=(a,k)=>a.reduce((s,x)=>s+n(x[k]),0);

const soort=x=>String(x.Crypto||"").trim().toLowerCase();
const cryptoRow=x=>!["airnodes","miner"].includes(soort(x));
const minerRow=x=>soort(x)==="miner";
const airnodeRow=x=>soort(x)==="airnodes";

const euro=x=>new Intl.NumberFormat(
    "nl-NL",
    {
        style:"currency",
        currency:"EUR",
        minimumFractionDigits:0,
        maximumFractionDigits:0
    }
).format(n(x));

const euro2=x=>new Intl.NumberFormat(
    "nl-NL",
    {
        style:"currency",
        currency:"EUR",
        minimumFractionDigits:2,
        maximumFractionDigits:2
    }
).format(n(x));

const dollar=x=>new Intl.NumberFormat(
    "en-US",
    {
        style:"currency",
        currency:"USD",
        minimumFractionDigits:0,
        maximumFractionDigits:0
    }
).format(n(x));

const getal=x=>new Intl.NumberFormat(
    "nl-NL",
    {
        minimumFractionDigits:0,
        maximumFractionDigits:8
    }
).format(n(x));

const tokens=x=>
    x==null||x===""
    ?""
    :Number(x).toLocaleString(
        "nl-NL",
        {maximumFractionDigits:8}
    );

const dca=(inleg,tokens)=>
    n(tokens)
    ?euro2(n(inleg)/n(tokens))
    :"";

const percentage=x=>
    n(x.Inleg)
    ?(n(x["Huidige waarde"])-n(x.Inleg))/n(x.Inleg)*100
    :null;

function koers(x){

    x=Number(x);

    if(!Number.isFinite(x))
        return "";

    const decimalen=x>10?0:x>=1?1:2;

    return x.toLocaleString(
        "nl-NL",
        {
            minimumFractionDigits:decimalen,
            maximumFractionDigits:decimalen
        }
    );
}


/* =========================
   FILTERS VULLEN
========================= */

function filtersVullen(){

    const cryptoSelect=el("cryptoFilter");
    const persoonSelect=el("persoonFilter");

    [...new Set(
        data.filter(cryptoRow)
            .map(x=>x.Crypto)
            .filter(Boolean)
    )]
    .sort()
    .forEach(x=>cryptoSelect.add(new Option(x,x)));

    [...new Set(
        data.filter(cryptoRow)
            .map(x=>x.Wie)
            .filter(Boolean)
    )]
    .sort()
    .forEach(x=>persoonSelect.add(new Option(x,x)));

}


/* =========================
   CRYPTO TABEL
========================= */

function cryptoTabel(bron){

    const regels=[...bron].sort(
        (a,b)=>(percentage(b)??-Infinity)-(percentage(a)??-Infinity)
    );

    el("cryptoTabel").innerHTML=regels.map(x=>{

        const inleg=n(x.Inleg);
        const huidige=n(x["Huidige waarde"]);
        const rendement=huidige-inleg;
        const pct=percentage(x);

        const kleur=
            rendement>0
            ?"rendement-positief"
            :rendement<0
            ?"rendement-negatief"
            :"";

        return `
        <tr>
            <td>${x.Wie||""}</td>
            <td>${x.Crypto||""}</td>
            <td>${euro(inleg)}</td>
            <td>${tokens(x.Tokens)}</td>
            <td>${dca(inleg,x.Tokens)}</td>
            <td>${koers(x.Koers)}</td>
            <td>${x["Huidige waarde"]!=null?euro(huidige):""}</td>
            <td class="${kleur}">
                ${x["Huidige waarde"]!=null?euro(rendement):""}
            </td>
            <td class="${kleur}">
                ${
                    pct==null
                    ?""
                    :pct.toLocaleString(
                        "nl-NL",
                        {
                            minimumFractionDigits:2,
                            maximumFractionDigits:2
                        }
                    )+" %"
                }
            </td>
        </tr>
        `;

    }).join("");

}


/* =========================
   AIRNODE / MINER TABELLEN
========================= */

function simpeleTabel(id,filter){

    el(id).innerHTML=data
        .filter(filter)
        .map(x=>`
            <tr>
                <td>${x.Wie||""}</td>
                <td>${x.Crypto||""}</td>
                <td>${x.Inleg!=null?euro(x.Inleg):""}</td>
                <td>${x.Aantal??""}</td>
            </tr>
        `)
        .join("");

}


/* =========================
   GRAFIEK
========================= */

function grafiek(){

    const totaal={};

    data.filter(cryptoRow).forEach(x=>{
        totaal[x.Crypto]=(totaal[x.Crypto]||0)+n(x.Inleg);
    });

    const top=Object.entries(totaal)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10);

    const labels=top.map(x=>x[0]);
    const waarden=top.map(x=>x[1]);
    const maximum=Math.max(...waarden,1);

    Plotly.react(

        "barAlleCrypto",

        [{
            x:waarden,
            y:labels,
            type:"bar",
            orientation:"h",
            text:waarden.map(euro),
            texttemplate:"%{text}",
            textposition:"outside",
            cliponaxis:false,
            marker:{line:{width:1}},
            hovertemplate:"<b>%{y}</b><br>Inleg: %{text}<extra></extra>"
        }],

        {
            title:{
                text:"TOP 10 CRYPTO // INLEG",
                font:{
                    size:17,
                    color:"#f0b83e"
                }
            },

            margin:{
                l:85,
                r:100,
                t:60,
                b:35
            },

            height:450,

            xaxis:{
                showgrid:true,
                gridcolor:"#263345",
                showticklabels:false,
                zeroline:false,
                range:[0,maximum*1.2]
            },

            yaxis:{
                autorange:"reversed",
                tickfont:{
                    size:13,
                    color:"#d8dee8"
                }
            },

            plot_bgcolor:"#080d15",
            paper_bgcolor:"#080d15",

            font:{
                family:"Arial",
                color:"#d8dee8"
            }
        },

        {
            responsive:true,
            displayModeBar:false
        }

    );

}


/* =========================
   DASHBOARD UPDATE
========================= */

function update(){

    const cryptoKeuze=el("cryptoFilter").value;
    const persoonKeuze=el("persoonFilter").value;

    const selectie=data
        .filter(cryptoRow)
        .filter(x=>
            (cryptoKeuze==="Allen"||x.Crypto===cryptoKeuze) &&
            (persoonKeuze==="Allen"||x.Wie===persoonKeuze)
        );

    const cryptoInleg=som(data.filter(cryptoRow),"Inleg");
    const minerInleg=som(data.filter(minerRow),"Inleg");
    const airnodeInleg=som(data.filter(airnodeRow),"Inleg");

    const inleg=som(selectie,"Inleg");
    const volume=som(selectie,"Tokens");
    const huidigeWaarde=som(selectie,"Huidige waarde");
    const rendement=huidigeWaarde-inleg;

    /* Bovenste tiles */

    el("totaleInvestering").textContent=
        euro(cryptoInleg+minerInleg+airnodeInleg);

    el("totaleInleg").textContent=
        euro(cryptoInleg);

    el("minerInleg").textContent=
        euro(minerInleg);

    el("airnodeInleg").textContent=
        euro(airnodeInleg);

    el("metamask").textContent=
        getal(som(data,"Metamask"));

    el("wmtxWallet").textContent=
        getal(wmtxTotaal);

    el("wmtxGekochtTooltip").textContent=
        getal(wmtxGekocht);

    el("wmtxStakingTooltip").textContent=
        getal(wmtxStaking);

    el("unityNode").textContent=
        dollar(som(data,"Unity node"));

    el("airnodesRendement").textContent=
        dollar(som(data,kolomLNaam));


    /* KPI's */

    el("inleg").textContent=
        euro(inleg);

    el("dca").textContent=
        volume
        ?euro2(inleg/volume)
        :euro2(0);

    el("volume").textContent=
        tokens(volume);

    el("huidigeWaarde").textContent=
        euro(huidigeWaarde);

    const rendementElement=el("rendement");

    rendementElement.textContent=euro(rendement);

    rendementElement.classList.remove(
        "kpi-positief",
        "kpi-negatief"
    );

    if(rendement>0)
        rendementElement.classList.add("kpi-positief");

    else if(rendement<0)
        rendementElement.classList.add("kpi-negatief");


    cryptoTabel(selectie);
}


/* =========================
   WEERGAVE
========================= */

function weergave(w){

    const crypto=w==="crypto";
    const airnodes=w==="airnodes";
    const miners=w==="miners";

    el("cryptoView").style.display=
        crypto?"block":"none";

    el("airnodeView").style.display=
        airnodes?"block":"none";

    el("minerView").style.display=
        miners?"block":"none";

    el("cryptoFilters").style.display=
        crypto?"flex":"none";

    el("toggleCrypto").classList.toggle("active",crypto);
    el("toggleAirnodes").classList.toggle("active",airnodes);
    el("toggleMiners").classList.toggle("active",miners);

}


/* =========================
   START
========================= */

el("latestUpdate").textContent=
    bron.latestUpdate||"";

filtersVullen();

el("cryptoFilter").addEventListener("change",update);
el("persoonFilter").addEventListener("change",update);

simpeleTabel("airnodeTabel",airnodeRow);
simpeleTabel("minerTabel",minerRow);

grafiek();
update();
weergave("crypto");