export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
} //simple sleep function