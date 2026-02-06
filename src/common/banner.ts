import figlet from "figlet";
import gradient from "gradient-string";

const grad = gradient(["#ff6b6b", "#4ecdc4"]);

export function printBanner(title: string) {
    console.log(grad(figlet.textSync(title, { horizontalLayout: "default" })));
    console.log();
}
