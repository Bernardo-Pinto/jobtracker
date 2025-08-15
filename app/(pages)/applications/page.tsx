'use client';
import { useState, useEffect } from "react";
import CustomDataGrid from "../../../components/data-grid"

async function fetchApplicationData(){

    try {
        const response = await fetch('/api/application', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    
        if (!response.ok) {
            console.log(' error: ' + response.statusText)
            throw new Error('Failed to get applications');
        }
    
        const result = await response.json();
        console.log(result.message); // "Application added successfully"
        return result;
    } catch (error) {
        console.error('Error gettins applications:', error);
    }
}

export default function Applications() {
    const [applicationList, setApplicationList] = useState([])
    const [loading, setLoading] = useState(true);
    const [updatedApplication, setUpdatedApplication] = useState(false)

      // Fetch data on component mount
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await fetchApplicationData();
                setApplicationList(data);
              } catch (error) {
                console.log('error fetching data: ' + error);
                //setError(error.message); //not implemented
              } finally {
                setLoading(false);
            }
        };
        fetchData(); //run on mount
    }, [updatedApplication]);

    if (loading) {
        return <div>Loading...</div>;
      }
     else return (
        <CustomDataGrid applicationsData={applicationList} funcUpdatedApplication={setUpdatedApplication}/>
)}