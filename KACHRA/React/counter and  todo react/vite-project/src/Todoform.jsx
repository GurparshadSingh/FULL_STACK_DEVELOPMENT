import { useState } from "react";

export default function Todoform({ addTodo, upperCaseAll }) {

    let [inputVal, setInputVal] = useState("");

    function handleEvent(e) {
        e.preventDefault();

        addTodo(inputVal);
        setInputVal("");
    }

    return (
        <div>
            <form onSubmit={handleEvent}>
                <input type="text" placeholder="Enter your todo" value={inputVal} onChange={(e) => {
                    setInputVal(e.target.value);
                }} />

                <button type="submit">
                    Add
                </button>


            </form>
            <button onClick={upperCaseAll}> uppercase All</button>


        </div>
    );
}