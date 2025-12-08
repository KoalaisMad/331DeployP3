import React, { useEffect, useState } from 'react';
import './Manager.css';
import API_URL from '../config';

const ALLOWED_ROLES = ['None','Employee', 'Manager'];

/**
 * Employees management component.
 * @function
 * @returns {JSX.Element} The employees component.
 */
export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [editValue, setEditValue] = useState('');

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(ALLOWED_ROLES[0]);
  const [newEmail, setNewEmail] = useState('')
  const [addWarning, setAddWarning] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [modalAge, setModalAge] = useState('');
  const [modalRole, setModalRole] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const API_BASE = `${API_URL}/api`;
  
  async function apiFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, options);
  }

  async function getEmployees() {
    try {
      const response = await apiFetch('/employees');
      if(!response.ok) {
        console.log("Getting employees failed");
      }
      return response.json();
    }
    catch(error) {
      console.error("Error: ", error);
    }
  }

  async function loadEmployees() {
    // SQL to fetch employee list (log for backend wiring)
    const sql = `SELECT id, name, role, email FROM employees ORDER BY id;`;
    console.log('SQL - loadEmployees:', sql);

    const employeeList = await getEmployees();
    setEmployees(employeeList);
  }

  async function updateEmployeeString(employee, property) {
    let newValue = '';
    if (property === 'name') newValue = employee.name;
    else if (property === 'email') newValue = employee.email;
    else if (property === 'role') newValue = employee.role;
    else newValue = String(property);

    const sqlStatement = `UPDATE employees SET ${property}='${newValue}' WHERE id=${employee.id};`;
    console.log('SQL - updateEmployeeString:', sqlStatement);
    
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

  function handleEmailDoubleClick(id, current) {
    setEditingCell({ id, field: 'email' });
    setEditValue(current || '');
  }

  // Function for saving name within name table column
  function handleSaveEdit(id, field) {
    if (field === 'name') {
      setEmployees(prev => prev.map(e => e.id === id ? { ...e, name: editValue } : e));
      const emp = employees.find(e => e.id === id);
      updateEmployeeString({ ...emp, name: editValue }, 'name');
    }
    if(field === 'email') {
      setEmployees(prev => prev.map(e => e.id === id ? {...e, email: editValue} : e));
      const emp = employees.find(e => e.id === id);
      updateEmployeeString({...emp, email: editValue}, 'email')
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

  function openEmployeeModal(emp) {
    setSelectedEmployee(emp);
    setModalEmail(emp.email || '');
    setModalPhone(emp.phone || '');
    setModalAddress(emp.address || '');
    setModalAge(emp.age || '');
    setModalRole(emp.role || '');
    setPhoneError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedEmployee(null);
    setModalEmail('');
    setModalPhone('');
    setModalAddress('');
    setModalAge('');
    setModalRole('');
    setPhoneError('');
  }

  function handlePhoneChange(value) {
    const digits = value.replace(/\D/g, '');
    setModalPhone(digits);
    
    if (digits.length === 0) {
      setPhoneError('');
    } else if (digits.length !== 10) {
      setPhoneError('Invalid: Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  }

  async function saveEmployeeDetails() {
    if (!selectedEmployee) return;

    if (modalPhone && modalPhone.length !== 10) {
      setPhoneError('Invalid: Phone number must be exactly 10 digits');
      return;
    }

    const updatedEmployee = {
      ...selectedEmployee,
      email: modalEmail,
      phone: modalPhone,
      address: modalAddress,
      age: modalAge ? parseInt(modalAge) : null,
      role: modalRole
    };

    try {
      const response = await apiFetch("/employees/details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEmployee)
      });

      if (response.ok) {
        setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? updatedEmployee : e));
        closeModal();
      } else {
        alert('Failed to update employee details');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee details');
    }
  }

  function deleteItemRow(employee) {
    setEmployees(prev => prev.filter(e => e.id !== employee.id));
    const sql = `DELETE FROM employees WHERE id=${employee.id};`;
    console.log('SQL - deleteEmployee:', sql);
    
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
    const newEmp = { id: null, name: newName.trim(), role: newRole, email: newEmail };
    insertSQL('employees', '(name, role)', `'${newEmp.name}', '${newEmp.role}'`);
    
    const response = await apiFetch("/employees", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(newEmp)
    });
    const generatedEmp = await response.json();

    setEmployees(prev => [...prev, generatedEmp]);
    setNewName('');
    setNewEmail('');
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
              <th>Email</th>
              <th>Role</th>
              <th>View/Edit</th>
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
                <td >
                  {editingCell.id === emp.id && editingCell.field === 'email' ? (
                    <input
                      className="edit-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => handleSaveEdit(emp.id, 'email')}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit(emp.id, 'email')}
                      autoFocus
                    />
                  ) : (
                    <div onDoubleClick={() => handleEmailDoubleClick(emp.id, emp.email)}
                         style={{
                          minHeight: '30px',
                          padding: '4px',
                          cursor: 'pointer'
                         }}>{emp.email}</div>
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
                  <button className="action-btn" onClick={() => openEmployeeModal(emp)}>View/Edit</button>
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
        <input className="date-input" placeholder="Email (gmail)" value={newEmail} onChange={e => setNewEmail(e.target.value)}/>
        <button className="add-new-btn" onClick={addEmployee}>Add</button>
        {addWarning && <div style={{ color: '#bd2130', marginLeft: '1rem' }}>{addWarning}</div>}
      </div>

      {/* Employee Details Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <h3>Employee Details</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>Name:</label>
                <div>{selectedEmployee?.name}</div>
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>Email:</label>
                <input 
                  type="email"
                  className="date-input" 
                  value={modalEmail} 
                  onChange={e => setModalEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>Phone:</label>
                <input 
                  type="tel"
                  className="date-input" 
                  value={modalPhone} 
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  maxLength="10"
                />
                {phoneError && <div style={{color: '#dc3545', fontSize: '0.9rem', marginTop: '0.25rem'}}>{phoneError}</div>}
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>Address:</label>
                <input 
                  type="text"
                  className="date-input" 
                  value={modalAddress} 
                  onChange={e => setModalAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>Age:</label>
                <input 
                  type="number"
                  className="date-input" 
                  value={modalAge} 
                  onChange={e => setModalAge(e.target.value)}
                  placeholder="Enter age"
                  min="18"
                  max="100"
                />
              </div>
              <div>
                <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>Role:</label>
                <select className="date-input" value={modalRole} onChange={e => setModalRole(e.target.value)}>
                  {ALLOWED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end'}}>
              <button className="add-new-btn" onClick={saveEmployeeDetails}>Save</button>
              <button className="action-btn delete-btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
