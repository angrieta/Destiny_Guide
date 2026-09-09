/** Shared by the build, static header and React header. Item URL slugs remain unchanged. */
export function normalizeSearch(value) {
    return String(value ?? "").normalize("NFKC").toLowerCase()
        .replace(/[’']/g,"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").normalize("NFC")
        .replace(/[^\p{L}\p{N}]+/gu," ").trim();
}

const TERM_GROUPS = [
    ["드랍","드롭","드랍테이블","드롭테이블","드랍표","드롭표","drop","drops","ドロップ","botin","butin"],
    ["데이터베이스","데이타베이스","아이템디비","디비","database","db","データベース"],
    ["아이템","장비","item","items","アイテム","装備","objet","objeto"],
    ["몬스터","적","monster","enemy","モンスター","敵","monstre","monstruo"],
    ["무기","weapon","weapons","武器","arme","arma"],
    ["갑옷","프레임","armor","frame","防具","鎧","armure","armadura"],
    ["방패","쉴드","실드","shield","shields","盾","bouclier","escudo"],
    ["유닛","unit","units","ユニット","unite","unidad"],
    ["마그","mag","mags","マグ"],
    ["마테리얼","material","materials","マテリアル"],
    ["포톤드롭","포톤드랍","photon drop","pd","フォトンドロップ"],
    ["사냥","파밍","farm","farming"],
    ["공속","공격속도","attack speed","攻撃速度"],
    ["시전속도","캐스팅","cast speed","casting","詠唱速度"],
    ["명중","명중률","ata","accuracy","命中","precision"],
    ["무적","invincibility","invincible","無敵","invencibilidad","invincibilite"],
    ["빙결","얼리기","freeze","frozen","凍結","gel","congelacion"],
    ["마비","paralyze","paralysis","麻痺","paralysie","paralisis"],
    ["헬","hell","ヘル"], ["데몬","데몬스","demons","デーモン"],
    ["차지","charge","チャージ"], ["버서크","berserk","バーサーク"],
    ["노말","normal","ノーマル"], ["하드","hard","ハード"],
    ["베리하드","베하","very hard","vh","ベリーハード"],
    ["얼티메이트","울티메이트","얼티","울티","ultimate","ult","アルティメット"],
    ["비리디아","viridia","ヴィリディア"], ["그리닐","그리니일","greenill","グリーニル"],
    ["스카일리","skyly","スカイリー"], ["블루풀","bluefull","ブルーフル"],
    ["퍼플넘","퍼플럼","purplenum","パープルナム"], ["핑칼","pinkal","ピンカル"],
    ["레드리아","redria","レッドリア"], ["오란","oran","オラン"],
    ["옐로부즈","옐로보즈","yellowboze","イエローブーズ"], ["휘틸","위틸","whitill","ホワイティル"],
    ["갸란즈","가란즈","garanz","ギャランゾ"], ["바란즈","baranz","バランゾ"],
    ["주","zu"], ["아스타크","astark","アスターク"], ["메리사","merissa","メリッサ"],
    ["볼옵트","vol opt","ボルオプト"], ["일길","ill gill","イルギル"],
    ["고란","goran","ゴラン"], ["콘드리유","kondrieu"], ["파주주","pazuzu"],
    ["사이코완드","사이코원드","psycho wand","サイコウォンド"],
    ["프로즌슈터","프로즌","frozen shooter","フローズンシューター"],
    ["헤븐리배틀","heavenly battle","ヘブンリーバトル"],
    ["그레이브디거","grave digger"], ["다크플로우","dark flow","df","ダークフロウ"],
    ["쯔미키리","츠미키리","tsumikiri j sword","tjs","ツミキリ"],
    ["pb플로우","pb flow","피비플로우"]
].map(group=>group.map(normalizeSearch));

export function expandSearchText(value) {
    const text=normalizeSearch(value), padded=" "+text+" ", extras=[];
    for(const group of TERM_GROUPS) {
        if(group.some(term=>padded.includes(" "+term+" "))) extras.push(...group);
    }
    return [...new Set((text+" "+extras.join(" ")).split(" ").filter(Boolean))].join(" ");
}

const GROUPS={guide:["search.group.guide","Guides"],raid:["search.group.raid","Raids"],tool:["search.group.tool","Tools"],data:["search.group.data","Data"]};
function score(name, searchText, aliases, query, tokens) {
    if(!query) return 0;
    if(name===query) return 1000;
    const compact=s=>s.replace(/ /g,"");
    if(compact(name)===compact(query)) return 970;
    if(aliases && (" "+aliases+" ").includes(" "+query+" ")) return 940-Math.min(name.length,60)*.5;
    let found=0;
    if(name.startsWith(query)) found=700;
    else if((" "+name).includes(" "+query)) found=520;
    else if(name.includes(query)) found=340;
    else if(searchText.includes(query)) found=220;
    if(!found) {
        if(tokens.every(token=>searchText.includes(token))) found=120;
        else if(query.length>=3 && compact(name).includes(compact(query))) found=300;
        else return 0;
    }
    return found-Math.min(name.length,60)*.5;
}
export function searchIndex(index, rawQuery, translate=(key,fallback)=>fallback, scope="all") {
    const query=normalizeSearch(rawQuery), tokens=query.split(" ").filter(Boolean);
    if(!query || !index) return [];
    const results=[];
    if(scope==="all" || scope==="pages") for(const page of index.pages || []) {
        const title=page.k ? translate(page.k,page.t) : page.t;
        const haystack=expandSearchText(title+" "+page.t+" "+page.d+" "+page.g+" "+(page.s || ""));
        const value=score(normalizeSearch(title),haystack,expandSearchText(title+" "+page.t),query,tokens);
        if(value>0) results.push({kind:"page",name:title,meta:"",badge:translate(...(GROUPS[page.g] || GROUPS.data)),url:page.u,exclusive:false,score:value+30});
    }
    for(const kind of ["items","drops"]) {
        if(scope!=="all" && scope!==kind) continue;
        for(const row of index[kind] || []) {
            const value=score(normalizeSearch(row[0]),row[4],row[6] || "",query,tokens);
            if(value<=0) continue;
            const drop=kind==="drops";
            let url=row[1];
            if(drop && row[7]?.length) {
                const selected=row[7].filter(section=>tokens.some(token=>expandSearchText(section).split(" ").includes(token)));
                if(selected.length===1) {
                    const parsed=new URL(url,"https://search.invalid/");
                    parsed.searchParams.set("section",selected[0]);url=parsed.pathname.slice(1)+parsed.search;
                }
            }
            results.push({
                kind:drop?"drop":"item",name:row[0],meta:row[3],
                badge:drop?translate("search.group.drops","Drops"):(row[5]?"Destiny":translate("search.group.database","Item DB"))+" · "+row[2],
                url,exclusive:Boolean(row[5]),score:value+(drop?-15:row[5]?10:20)
            });
        }
    }
    return results.sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name) || a.url.localeCompare(b.url));
}
