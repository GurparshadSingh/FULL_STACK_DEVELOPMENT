function printHello() {
    console.log("Hello");
}
function print() {
    console.log("done");
}

export default function Button() {
    return (
        <div>
            <button onClick={printHello}>
                Click me!
            </button>
            <h1 onMouseOver={print}>Hover</h1>
        </div>
    )
}