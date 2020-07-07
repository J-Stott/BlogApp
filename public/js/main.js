function makeResponsive() {
    let nav = document.querySelector(".navigation");
    if (nav.className === "navigation") {
        nav.className += " responsive";
    } else {
        nav.className = "navigation";
    }
}