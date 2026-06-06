import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';

const ProjectModal = ({ open, project, onClose, onSave, isEditing }) => {
    const [formData, setFormData] = useState({
        name: '',
        project_code: '',
        status: '',
    });

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                project_code: project.project_code,
                status: project.status,
            });
        }
    }, [project]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSave = async () => {
        await onSave({ ...project, ...formData });
        onClose(); // Close the modal after saving
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{isEditing ? 'Edit Project' : 'View Project'}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    name="name"
                    label="Project Name"
                    type="text"
                    fullWidth
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                />
                <TextField
                    margin="dense"
                    name="project_code"
                    label="Project Code"
                    type="text"
                    fullWidth
                    value={formData.project_code}
                    onChange={handleChange}
                    disabled={!isEditing}
                />
                <TextField
                    margin="dense"
                    name="status"
                    label="Status"
                    type="text"
                    fullWidth
                    value={formData.status}
                    disabled
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Exit
                </Button>
                {isEditing && (
                    <Button onClick={handleSave} color="primary">
                        Save
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ProjectModal;
