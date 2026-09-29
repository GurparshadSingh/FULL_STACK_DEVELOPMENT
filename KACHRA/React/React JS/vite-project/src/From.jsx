function submitForm(e) {
    e.preventDefault();
    console.log("Hello");
}

export default function Form() {
    return (
        <form action="#">
            <input type="text" />
            <button onClick={submitForm}></button>
        </form>
    );
}