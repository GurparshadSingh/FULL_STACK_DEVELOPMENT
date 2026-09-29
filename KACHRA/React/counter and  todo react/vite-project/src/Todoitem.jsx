export default function TodoItem({ todos, deleteTodo, upperCaseThis, markAsDone }) {
    return (
        <div>
            {todos.map((todo) => (
                <div key={todo.id}>
                    <br />
                    <br />
                    <span style={{ textDecoration: todo.done ? "line-through" : "none" }}>{todo.text}</span>
                    <br />
                    <button onClick={() => {
                        deleteTodo(todo.id)
                    }}>
                        Delete
                    </button>
                    <br />
                    <button onClick={() => upperCaseThis(todo.id)}>Upper case this</button>
                    <br />
                    <button onClick={() => markAsDone(todo.id)}>mark as done</button>
                </div>

            ))}
        </div>
    );
}