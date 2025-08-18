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
        return result;
    } catch (error) {
        console.error('Error getting applications:', error);
    }
}

export default function Applications() {
    const [applicationList, setApplicationList] = useState([])
    const [loading, setLoading] = useState(true);
    const [updatedApplication, setUpdatedApplication] = useState(false)

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await fetchApplicationData();
                setApplicationList(data);
              } catch (error) {
                console.log('error fetching data: ' + error);
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
        <CustomDataGrid 
        applicationsData={applicationList}
        funcUpdatedApplication={setUpdatedApplication}
        />
    )
}