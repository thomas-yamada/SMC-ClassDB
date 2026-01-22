//parse the Location from the HTML
export function parseLocation(raw) {
    if (!raw) return { building: null, room: null};

    const cleaned = raw
        .replace(/^Location:/i, "")
        .replace(/[\uE000-\uF8FF]/g, "")
        .trim();

    if (/ONLINE/i.test(cleaned)) {
        return { building: "ONLINE", room: "ONLINE" };
    }

    if (/TBA/i.test(cleaned)) {
        return {};
    }

    let m = cleaned.match(/^([A-Z]+)\s+(.+)$/);
    if (m) {
        return {
            building: m[1],
            room: m[2]
        };
    }

    m = cleaned.match(/^([A-Z]+)$/);
    if (m) {
        return {
            building: m[1],
            room: null
        };
    }

    return {
        building: null,
        room: null
    };
}