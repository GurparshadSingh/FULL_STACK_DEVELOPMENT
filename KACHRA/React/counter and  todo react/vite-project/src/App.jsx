import { useState } from 'react'
import './App.css'


// import Counter from './Counter'
import Todoform from "./Todoform";
import Todoitem from "./Todoitem";
function App() {
  const [todos, setTodos] = useState([]);

  function addTodo(todo) {
    const newTodo = {
      id: Date.now(),
      text: todo,
      done: false
    }
    setTodos([...todos, newTodo]);
    // console.log(todos);
  }

  function deleteTodo(id) {
    setTodos(todos.filter((todo) => {
      return todo.id !== id
    }))
  }
  let upperCaseAll = () => {

    let result = todos.map((todo) => {
      return { ...todo, text: todo.text.toUpperCase() }
    })
    setTodos(result);

  }
  let upperCaseThis = (id) => {

    let result = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, text: todo.text.toUpperCase() }
      }
      return todo
    })
    setTodos(result);

  }


  let markAsDone = (id) => {
    let result = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, done: true }
      }
      return todo
    })
    setTodos(result);
  }


  return (
    <>
      {/* <Counter /> */}
      <Todoform addTodo={addTodo} upperCaseAll={upperCaseAll} />
      <Todoitem todos={todos} deleteTodo={deleteTodo} upperCaseThis={upperCaseThis} markAsDone={markAsDone}/>
    </>
  )
}

export default App
