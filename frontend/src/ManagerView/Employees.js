import React, { useEffect, useState } from 'react';
import './Manager.css';

const ALLOWED_ROLES = ['Employee', 'Manager'];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(ALLOWED_ROLES[0]);
  const [addWarning, setAddWarning] = useState('');

  // This hook runs once after the initial render to fetch all necessary dynamic data
  useEffect(() => {
    loadEmployees();
  }, []);

  // Use relative path - works both locally and on deployed server
  const API_BASE = '/api';
  
  async function apiFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, options);
  }

  async function getEmployees() {
    try {
      // await pauses getEmployees function  without blocking other parts of program
      const response = await apiFetch('/employees');
      if(!response.ok) {
        console.log("Getting employees failed");
      }
      // returns promise (placeholder), to be handled by await in calling function
      return response.json();
    }
    catch(error) {
      console.error("Error: ", error);
    }
  }

  async function loadEmployees() {
    // SQL to fetch employee list (log for backend wiring)
    const sql = `SELECT id, name, role FROM employees ORDER BY id;`;
    console.log('SQL - loadEmployees:', sql);

    // Get employees
    const employeeList = await getEmployees();
    setEmployees(employeeList);
  }

  // private function that updates employee string depending on employee
  async function updateEmployeeString(employee, property) {
    let newValue = '';
    if (property === 'name') newValue = employee.name;
    else if (property === 'role') newValue = employee.role;
    else newValue = String(property);

    const sqlStatement = `UPDATE employees SET ${property}='${newValue}' WHERE id=${employee.id};`;
    console.log('SQL - updateEmployeeString:', sqlStatement);
    // TODO: call backend API instead of console.log
    apiFetch("/employees", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({employee, property, newValue})
    })
  }

  function handleNameDoubleClick(id, current) {
    setEditingCell({ id, field: 'name' });
    setEditValue(current || '');
  }

  // Function for saving name within name table column
  function handleSaveEdit(id, field) {
    if (field === 'name') {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, name: editValue } : e));
      const emp = employees.find(e => e.id === id);
      updateEmployeeString({ ...emp, name: editValue }, 'name');
    }
    setEditingCell({ id: null, field: null });
    setEditValue('');
  }

  function handleRoleChange(id, newRoleVal) {
    if (!ALLOWED_ROLES.includes(newRoleVal)) return;
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, role: newRoleVal } : e));
    const emp = employees.find(e => e.id === id);
    updateEmployeeString({ ...emp, role: newRoleVal }, 'role');
  }

  function deleteItemRow(employee) {
    setEmployees(prev => prev.filter(e => e.id !== employee.id));
    const sql = `DELETE FROM employees WHERE id=${employee.id};`;
    console.log('SQL - deleteEmployee:', sql);
    // CLient requests server to delete resource
    apiFetch("/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee)
    });
  }

  function insertSQL(tableName, columnString, valuesString) {
    const sqlStatement = `INSERT INTO ${tableName} ${columnString} VALUES (${valuesString});`;
    console.log('SQL - insertSQL:', sqlStatement);
  }

  async function addEmployee() {
    // Validate input
    if (!newName.trim() || !newRole || !ALLOWED_ROLES.includes(newRole)) {
      setAddWarning("Invalid input. Role must be 'Employee' or 'Manager' and name cannot be empty.");
      return;
    }
    // Inconsistent with what is in database - needs to be resolved
    // const nextId = employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1;
    const newEmp = { id: null, name: newName.trim(), role: newRole };
    insertSQL('employees', '(name, role)', `'${newEmp.name}', '${newEmp.role}'`);
    // Client requests adding resource for employee
    const response = await apiFetch("/employees", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(newEmp)
    });
    const generatedEmp = await response.json();

    setEmployees(prev => [...prev, generatedEmp]);
    setNewName('');
    setNewRole(ALLOWED_ROLES[0]);
    setAddWarning('');
  }

  return (
    <div className="tab-panel">
      <h2>Employee Information</h2>

      <div className="table-container">
        <table className="manager-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>
                  {editingCell.id === emp.id && editingCell.field === 'name' ? (
                    <input
                      className="edit-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit(emp.id, 'name')}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(emp.id, 'name')}
                      autoFocus
                    />
                  ) : (
                    <span onDoubleClick={() => handleNameDoubleClick(emp.id, emp.name)}>{emp.name}</span>
                  )}
                </td>
                <td>
                  <select value={emp.role} onChange={e => handleRoleChange(emp.id, e.target.value)}>
                    {ALLOWED_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="action-btn delete-btn" onClick={() => deleteItemRow(emp)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input className="date-input" placeholder="Employee name" value={newName} onChange={e => setNewName(e.target.value)} />
        <select className="date-input" value={newRole} onChange={e => setNewRole(e.target.value)}>
          {ALLOWED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="add-new-btn" onClick={addEmployee}>Add</button>
        {addWarning && <div style={{ color: '#bd2130', marginLeft: '1rem' }}>{addWarning}</div>}
      </div>
    </div>
  );
}
