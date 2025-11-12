import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Taxes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taxFileNumber, setTaxFileNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 获取税号信息
  useEffect(() => {
    const fetchTaxDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/employees/${id}`);
        setTaxFileNumber(response.data.taxFileNumber || '');
      } catch (error) {
        console.error('Error fetching tax details:', error);
        setError('Error fetching tax details');
      }
    };

    fetchTaxDetails();
  }, [id]);

  // 更新税号信息
  const handleUpdate = async () => {
    if (!taxFileNumber) {
      setError('Please enter a valid Tax File Number');
      return;
    }
    try {
      const response = await axios.put(`http://localhost:5001/api/employees/${id}/update-tax`, { taxFileNumber });
      setMessage('Tax File Number updated successfully');
      setError('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating tax details:', error);
      const errorMessage = error.response ? error.response.data.message : 'Unexpected error';
      setError(errorMessage);
      setMessage('');
    }
  };

  return (
    <div>
      <h2>Tax Details for Employee ID: {id}</h2>
      <button className="back-button" onClick={() => navigate(-1)}>Back</button>
      <br />

      <label>
        Tax File Number (TFN):
        <input
          type="text"
          value={taxFileNumber}
          onChange={(e) => setTaxFileNumber(e.target.value)}
          placeholder="Enter Tax File Number"
        />
      </label>
      <br />

      <button onClick={handleUpdate}>Update TFN</button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Taxes;
