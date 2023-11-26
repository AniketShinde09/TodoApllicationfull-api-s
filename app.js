const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

let database;

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return requestQuery.priority !== undefined && requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return requestQuery.category !== undefined && requestQuery.status !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return requestQuery.category !== undefined && requestQuery.priority !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
          getTodoQuery = `
            SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400).send("Invalid Todo Status");
        }
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
      break;

    case hasCategoryAndStatus(request.query):
      if (category === "WORK" || category === "HOME" || category === "LEARNING") {
        if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
          getTodoQuery = `SELECT * FROM todo WHERE category ='${category}' AND status ='${status}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400).send("Invalid Todo Status");
        }
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;

    case hasCategoryAndPriority(request.query):
      if (category === "WORK" || category === "HOME" || category === "LEARNING") {
        if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
          getTodoQuery = `SELECT * FROM todo WHERE category ='${category}' AND priority ='${priority}';`;
          data = await database.all(getTodoQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400).send("Invalid Todo Priority");
        }
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `SELECT * FROM todo WHERE priority ='${priority}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
      break;

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `SELECT * FROM todo WHERE status ='${status}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Status");
      }
      break;

    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await database.all(getTodoQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
      break;

    case hasCategoryProperty(request.query):
      if (category === "WORK" || category === "HOME" || category === "LEARNING") {
        getTodoQuery = `SELECT * FROM todo WHERE category ='${category}';`;
        data = await database.all(getTodoQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;

    default:
      getTodoQuery = `SELECT * FROM todo;`;
      data = await database.all(getTodoQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getToDoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const responseResult = await database.get(getToDoQuery);
  response.send(outPutResult(responseResult));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValid(new Date(date))) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const requestQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const responseResult = await database.all(requestQuery);
    response.send(responseResult.map((eachItem) => outPutResult(eachItem)));
  } else {
    response.status(400).send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (category === "WORK" || category === "HOME" || category === "LEARNING") {
        if (isValid(new Date(dueDate))) {
          const postNewDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
            INSERT INTO  todo (id, todo, category, priority, status, due_date)
            VALUES (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDueDate}');`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400).send("Invalid Due Date");
        }
      } else {
        response.status(400).send("Invalid Todo Category");
      }
    } else {
      response.status(400).send("Invalid Todo Status");
    }
  } else {
    response.status(400).send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const {
    todo,
    priority,
    status,
    category,
    dueDate
  } = request.body;
  let updateTodoQuery;

  switch (true) {
    case status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
          UPDATE todo SET todo = '${todo}', priority = '${priority}', status='${status}', category='${category}',
           due_date = '${dueDate}' WHERE id = ${todoId}`;
        await database.run(updateTodoQuery);
        response.send(`Status Updated`);
      } else {
        response.status(400).send("Invalid Todo Status");
      }
      break;

    case priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
          UPDATE todo SET todo = '${todo}', priority = '${priority}', status='${status}',
           category='${category}', due_date = '${dueDate}' WHERE id = ${todoId}`;
        await database.run(updateTodoQuery);
        response.send(`Priority Updated`);
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
      break;

    case todo !== undefined:
      updateTodoQuery = `
          UPDATE todo SET todo = '${todo}', priority = '${priority}', status='${status}',
           category='${category}', due_date = '${dueDate}' WHERE id = ${todoId}`;
      await database.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;

    case category !== undefined:
      if (category === "WORK" || category === "HOME" || category === "LEARNING") {
        updateTodoQuery = `
          UPDATE todo SET todo = '${todo}', priority = '${priority}', status='${status}',
           category='${category}', due_date = '${dueDate}' WHERE id = ${todoId}`;
        await database.run(updateTodoQuery);
        response.send(`Category Updated`);
      } else {
        response.status(400).send("Invalid Todo Category");
      }
      break;

    case dueDate !== undefined:
      if (isValid(new Date(dueDate))) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
          UPDATE todo SET todo = '${todo}', priority = '${priority}', status='${status}',
           category='${category}', due_date = '${newDueDate}' WHERE id = ${todoId}`;
        await database.run(updateTodoQuery);
        response.send(`Due Date Updated`);
      } else {
        response.status(400).send("Invalid Due Date");
      }
      break;

    default:
      response.status(400).send("Invalid Update Request");
  }
});




app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE
    id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
