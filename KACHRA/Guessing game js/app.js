let max = prompt("enter the max number");

const random = Math.floor(Math.random() * max) + 1;

let guess_number = prompt("guess the number");

while (true) {
    if (guess_number == "quit") {
        console.log("user quit");
        break;
    }
    if (guess_number == random) {
        console.log("yes u were correct");
    } else if (guess_number < random) {
       guess_number= prompt("ur guess was too small");
    } else {
       guess_number= prompt("ur guess was too big");
    }
}