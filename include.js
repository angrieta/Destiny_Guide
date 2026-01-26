document.addEventListener("DOMContentLoaded", async () => {
        console.log("include.js 실행됨");
    
        const mount = document.getElementById("site-header");
        console.log("site-header 찾음", !!mount);
    
        if (!mount) return;
    
        try {
        console.log("header.html fetch 시작");
        const res = await fetch("./header.html");
        console.log("fetch 응답", res.status);
    
        const html = await res.text();
        mount.innerHTML = html;
        console.log("header 삽입 완료");
        } catch (e) {
        console.error("헤더 로드 실패", e);
        }
    });