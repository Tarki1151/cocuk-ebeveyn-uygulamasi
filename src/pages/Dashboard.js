import React, { useEffect, useState } from 'react';
import { generateClient } from '@aws-amplify/api';
import { fetchUserAttributes, getCurrentUser } from '@aws-amplify/auth';
import { listTasks } from '../graphql/queries';
import { createTask } from '../graphql/mutations';

const client = generateClient();

function Dashboard() {
  const [userRole, setUserRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });

  useEffect(() => {
    fetchUserRole();
    fetchTasks();
  }, []);

  async function fetchUserRole() {
    try {
      const attributes = await fetchUserAttributes();
      const role = attributes['custom:role'] || 'child';
      setUserRole(role);
    } catch (error) {
      console.error('Kullanıcı rolü alınamadı:', error);
    }
  }

  async function fetchTasks() {
    try {
      const taskData = await client.graphql({ query: listTasks });
      setTasks(taskData.data.listTasks.items);
    } catch (error) {
      console.error('Görevler alınamadı:', error);
    }
  }

  async function handleCreateTask() {
    try {
      const user = await getCurrentUser();
      const taskInput = {
        ...newTask,
        createdBy: user.username,
        status: 'pending'
      };
      await client.graphql({ query: createTask, variables: { input: taskInput } });
      fetchTasks();
      setNewTask({ title: '', description: '', assignedTo: '' });
    } catch (error) {
      console.error('Görev oluşturulamadı:', error);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{userRole === 'parent' ? 'Ebeveyn Paneli' : 'Çocuk Paneli'}</h1>
      {userRole === 'parent' && (
        <div>
          <h2>Yeni Görev Oluştur</h2>
          <input
            placeholder="Başlık"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            style={{ margin: '5px' }}
          />
          <input
            placeholder="Açıklama"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            style={{ margin: '5px' }}
          />
          <input
            placeholder="Çocuk ID'si"
            value={newTask.assignedTo}
            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
            style={{ margin: '5px' }}
          />
          <button onClick={handleCreateTask}>Oluştur</button>
        </div>
      )}
      <h2>Görevler</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {task.title} - {task.status} {userRole === 'child' && task.assignedTo === getCurrentUser().username ? '(Sana Atandı)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;

