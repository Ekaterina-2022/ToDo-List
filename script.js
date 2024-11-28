import {
	openDB,
	deleteDB,
	wrap,
	unwrap,
} from "https://cdn.jsdelivr.net/npm/idb@8/+esm";

const btnAdd = document.querySelector("#btn-add-new");
const btnClearAll = document.querySelector("#btn-clear-all");
const wrapper = document.querySelector(".wrapper");

let db;
init();

btnAdd.addEventListener("click", function () {
	const taskBox = document.createElement("div");
	const btnCreate = document.createElement("button");
	const btnClose = document.createElement("button");
	const taskTitle = document.createElement("input");
	const taskEntry = document.createElement("textarea");
	const btnGroup = document.createElement("div");
	taskTitle.setAttribute("placeholder", "ADD TASK...");
	taskEntry.setAttribute("rows", "8");
	taskEntry.setAttribute("maxlength", "500");
	taskTitle.classList.add("new-task-title");
	taskEntry.classList.add("new-task-descrip");
	btnCreate.classList.add("btn-create");
	btnClose.classList.add("btn-close");
	taskBox.classList.add("new-task");
	btnCreate.textContent = "SAVE";
	btnClose.textContent = "CLOSE";
	btnGroup.classList.add("btn-wrapper");
	taskBox.append(taskTitle, taskEntry);
	btnGroup.append(btnCreate, btnClose);
	taskBox.append(btnGroup);

	document.body.append(taskBox);

	btnCreate.addEventListener("click", function (e) {
		let newTitle = taskTitle.value;
		let newEntry = taskEntry.value;

		addTask(newTitle, newEntry, showError);

		newTitle = "";
		taskBox.style.display = "none";
	});

	btnClose.addEventListener("click", function (e) {
		taskBox.style.display = "none";
	});
});

btnClearAll.addEventListener("click", clearTasks);

async function init() {
	db = await idb.openDB("tasksDb", 1, {
		upgrade(db) {
			const store = db.createObjectStore("tasks", {
				keyPath: "id",

				autoIncrement: true,
			});

			store.createIndex("id", "id");
		},
	});

	list();
}

async function list() {
	let tx = db.transaction("tasks");
	let taskStore = tx.objectStore("tasks");

	let tasks = await taskStore.getAll();

	if (tasks.length) {
		wrapper.innerHTML = tasks
			.map(
				(task) => `<div class="task-wrapper">
				<div class="task-title">${task.title}</div>
				<div class="task-descrip">${task.descrip}</div>
				<div class="btn-wrapper">
				<button class="btn-details"></button>
				<button class="btn-del" data-id="${task.id}"></button>
				</div>
				</div>`
			)
			.join("");

		const btnDeleteArr = document.querySelectorAll(".btn-del");
		const btnDetailsArr = document.querySelectorAll(".btn-details");
		btnDeleteArr.forEach((item) => {
			item.addEventListener("click", async (event) => {
				const valueTaskId = parseInt(
					event.target.getAttribute("data-id")
				);

				const tx = db.transaction("tasks", "readwrite");
				const newStore = tx.objectStore("tasks");

				tx.oncomplete = (event) => {
					console.log("Transaction completed.");

					list();
				};

				tx.onerror = function (event) {
					alert("error in cursor request " + event.target.errorCode);
				};

				const delReq = await newStore.delete(valueTaskId);
			});
		});

		btnDetailsArr.forEach((item) => {
			item.addEventListener("click", (e) => {
				e.target.parentNode.parentNode.classList.toggle("task-details");
			});
		});
	} else {
		wrapper.innerHTML = `<div>No tasks. Add a new one</div>`;
	}
}

async function clearTasks() {
	let tx = db.transaction("tasks", "readwrite");
	await tx.objectStore("tasks").clear();
	await list();
}

async function addTask(title, descrip, errorMessage) {
	let tx = db.transaction("tasks", "readwrite");

	try {
		if (title === "" && descrip === "") {
			errorMessage();
			await addTask(title, descrip, errorMessage);
		} else {
			await tx.objectStore("tasks").add({ title, descrip });
			await list();
		}
	} catch (err) {
		if (err.name == "ConstraintError") {
			alert("task already exists");
			await addTask(title, descrip);
		} else {
			throw err;
		}
	}

	tx.done;
}

function showError() {
	let errorMessage = document.createElement("div");
	errorMessage.classList.add("err-message-empty");
	errorMessage.style.display = "flex";
	errorMessage.textContent = "Empty task";
	document.body.append(errorMessage);
	setInterval(() => (errorMessage.style.display = "none"), 1500);
}
