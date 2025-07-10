import React from 'react';

class TasksManager extends React.Component {
    state = {
        tasks: [],
        newTaskName: '',
    }

    componentDidMount() {
        fetch('https://super-simple-task-manager-backend.onrender.com/tasks')
            .then((response) => response.json())
            .then((tasks) => this.setState({tasks}));
        
        this.interval = setInterval(() => {
            this.setState((state) => {
                const updatedTasks = state.tasks.map((task) => {
                    if (task.isRunning) {
                        return {...task, time: task.time + 1};
                    }
                    return task;
                });
                return {tasks: updatedTasks};
            });
        }, 1000);
    }
    

    componentDidUpdate(prevProps, prevState) {
        this.state.tasks.forEach((task) => {
            const prevTask = prevState.tasks.find((t) => t.id === task.id);
    
            if (prevTask &&
                (
                    prevTask.isRunning !== task.isRunning ||
                    prevTask.isDone !== task.isDone ||
                    prevTask.isRemoved !== task.isRemoved ||
                    prevTask.time !== task.time
                )
            ) {
                fetch(`https://super-simple-task-manager-backend.onrender.com/tasks/${task.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-type': 'application/json' },
                    body: JSON.stringify({
                        isRunning: task.isRunning,
                        isDone: task.isDone,
                        isRemoved: task.isRemoved,
                        time: task.time,
                    }),
                }).catch((error) => console.error(error));
            }
        });
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    handleInputChange = (event) => {
        this.setState({ newTaskName: event.target.value });
    }

    handleFormSubmit = async (event) => {
        event.preventDefault();

        if (!this.state.newTaskName.trim()) {
            alert('Provide task name!');
            return;
        }

        const newTask = {
            name: this.state.newTaskName,
            time: 0,
            isRunning: false, 
            isDone: false,
            isRemoved: false,
        };

        const response = await fetch('https://super-simple-task-manager-backend.onrender.com/tasks', {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(newTask),
        });

        const savedTask = await response.json();

        this.setState((state) => ({
            tasks: [...state.tasks, savedTask],
            newTaskName: '',
        }));
    }

    toggleTaskRunning = (id) => {
        this.setState((state) => {
            const updatedTasks = state.tasks.map((task) => {
                if (task.id === id) {
                    return { ...task, isRunning: !task.isRunning };
                }
                return task;
            });
            return { tasks: updatedTasks};
        });
    };

    markTaskAsDone = (id) => {
        this.setState((state) => {
            const updatedTasks = state.tasks.map((task) => {
                if (task.id === id) {
                    return { ...task, isDone: true, isRunning: false };
                }
                return task;
            });

            return { tasks: updatedTasks.sort((a, b) => a.isDone - b.isDone) };
        });
    };

    removeTask = (id) => {
        this.setState((state) => {
            const updatedTasks = state.tasks.map((task) => {
                if (task.id === id) {
                    return { ...task, isRemoved: true };
                }
                return task;
            });

            return { tasks: updatedTasks };
        });
    };

    // nie widziałem, jak inaczej dodać format czasu, jaki podany był w zadaniu

    formatTime = (timeInSeconds) => {
        const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(timeInSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    renderTask = (task) => (
        <li className="task" key={task.id}>
            <header className="task__header">
                {task.name}<span className="task__time">{this.formatTime(task.time)}</span>
            </header>
            <footer className="task__footer">
                <button 
                    className={`task__button task__button--${task.isRunning ? 'stop' : 'start'}`} 
                    onClick={() => this.toggleTaskRunning(task.id)}
                >
                    {task.isRunning ? 'Stop' : 'Start'}
                </button>
                <button 
                    className="task__button task__button--done" 
                    onClick={() => this.markTaskAsDone(task.id)}
                >
                    Done
                </button>
                <button 
                    className="task__button task__button--delete" 
                    onClick={() => this.removeTask(task.id)} 
                    disabled={!task.isDone}
                >
                    Delete
                </button>
            </footer>
        </li>
    );

    render() {
        return (
            <div className="tasks-manager">
                <h1 className="tasks-manager__title">Tasks Manager</h1>
                <form className="tasks-manager__form" onSubmit={this.handleFormSubmit}>
                    <input 
                        className="tasks-manager__input"
                        type="text"
                        value={this.state.newTaskName}
                        onChange={this.handleInputChange}
                        placeholder="Enter task name"
                    />
                    <button className="tasks-manager__button tasks-manager__button--add" type="submit">
                        Add Task
                    </button>
                </form>
                <ul className="tasks-manager__list">
                    {this.state.tasks.filter((task) => !task.isRemoved).map(this.renderTask)}
                </ul>
            </div>
        );
    }
}

export default TasksManager;