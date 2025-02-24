/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const html = todos => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Todos</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css" rel="stylesheet"></link>
  </head>

  <body class="bg-blue-100">
    <div class="w-full h-full flex content-center justify-center mt-8">
      <div class="bg-white shadow-md rounded px-8 pt-6 py-8 mb-4">
        <h1 class="block text-grey-800 text-md font-bold mb-2">Todos</h1>
        <div class="flex">
          <input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-800 leading-tight focus:outline-none focus:shadow-outline" type="text" name="name" placeholder="A new todo"></input>
          <button class="bg-blue-500 hover:bg-blue-800 text-white font-bold ml-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline" id="create" type="submit">Create</button>
        </div>
        <div class="mt-4" id="todos"></div>
      </div>
    </div>
  </body>

  <script>
    window.todos = ${todos}

    var updateTodos = function() {
      fetch("/", { method: "PUT", body: JSON.stringify({ todos: window.todos }) })
      populateTodos()
    }

    var completeTodo = function(evt) {
      var checkbox = evt.target
      var todoElement = checkbox.parentNode
      var newTodoSet = [].concat(window.todos)
      var todo = newTodoSet.find(t => t.id == todoElement.dataset.todo)
      todo.completed = !todo.completed
      window.todos = newTodoSet
      updateTodos()
    }

    var populateTodos = function() {
      var todoContainer = document.querySelector("#todos")
      todoContainer.innerHTML = null

      window.todos.forEach(todo => {
        var el = document.createElement("div")
        el.className = "border-t py-4"
        el.dataset.todo = todo.id

        var name = document.createElement("span")
        name.className = todo.completed ? "line-through" : ""
        name.textContent = todo.name

        var checkbox = document.createElement("input")
        checkbox.className = "mx-4"
        checkbox.type = "checkbox"
        checkbox.checked = todo.completed ? 1 : 0
        checkbox.addEventListener("click", completeTodo)

        el.appendChild(checkbox)
        el.appendChild(name)
        todoContainer.appendChild(el)
      })
    }

    populateTodos()

    var createTodo = function() {
      var input = document.querySelector("input[name=name]")
      if (input.value.length) {
        window.todos = [].concat(todos, { id: window.todos.length + 1, name: input.value, completed: false })
        input.value = ""
        updateTodos()
      }
    }

    document.querySelector("#create").addEventListener("click", createTodo)
  </script>
</html>
`;

export default {
  async fetch(request, env, ctx) {
    const defaultData = {
      todos: [
        {
          id: 1,
          name: 'Finish the Cloudflare Workers blog post',
          completed: false,
        },
      ],
    };
    const setCache = (key, data) => env.TODOS.put(key, data);
    const getCache = key => env.TODOS.get(key);

    const ip = request.headers.get('CF-Connecting-IP');
    const myKey = `data-${ip}`;

    if (request.method === 'PUT') {
      const body = await request.text();
      try {
        JSON.parse(body);
        await setCache(myKey, body);
        return new Response(body, { status: 200 });
      } catch (err) {
        return new Response(err, { status: 500 });
      }
    }

    let data;

    const cache = await getCache();
    if (!cache) {
      await setCache(myKey, JSON.stringify(defaultData));
      data = defaultData;
    } else {
      data = JSON.parse(cache);
    }

    const body = html(JSON.stringify(data.todos).replace(/</g, '\\u003c'));

    return new Response(body, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  },
};

