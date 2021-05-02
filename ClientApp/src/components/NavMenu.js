import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import './NavMenu.css';
import {Button, List, ListItem, ListItemText, Collapse, makeStyles} from "@material-ui/core";
import {createMuiTheme, ThemeProvider} from "@material-ui/core";

const theme = createMuiTheme({
    overrides: {
        MuiList: {
            root: {
                position: "fixed"
            }
        }
    }
})

const styles = makeStyles((theme) => ({
    root: {
        height: "100%",
        width: "10%"
    },
    nested: {
        width: "10%",
        paddingLeft: theme.spacing(2)
    }
}))

export default function NavMenu() {
    const [message, setMessage] = useState("");
    const [dropDown, setDropDown] = useState(false);
    const classes = styles();

    function toggleDropDown() {
        setDropDown(prevState => !prevState);
    }

    return (
        <ThemeProvider theme={theme}>
        <List component="nav" className={classes.root}>
            <ListItem button component={Link} to="/">
                <ListItemText primary="Home" />
            </ListItem>
            <ListItem button component={Link} to="/search">
                <ListItemText primary="Search"/>
            </ListItem>
            <ListItem button component={Link} to="/streamers">
                <ListItemText primary="Streamers" />
            </ListItem>
            <ListItem button onClick={toggleDropDown}>
                <ListItemText primary="Settings" />
            </ListItem>
            <Collapse in={dropDown} timeout="auto" unmountOnExit>
                <List className={classes.root}>
                    <ListItem button component={Link} to="/setup">
                        <ListItemText className={classes.nested} primary="Setup" />
                    </ListItem>
                    <ListItem button component={Link} to="/xd">
                        <ListItemText className={classes.nested} primary="xd" />
                    </ListItem>
                </List>
            </Collapse>
        </List>
        </ThemeProvider>
    );
}
