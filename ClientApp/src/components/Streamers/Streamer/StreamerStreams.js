import React, {useState, useEffect} from "react";
import loading from "../../../assets/images/loading.gif";
import "../../../assets/styles/StreamSearch.css";
import cloneDeep from 'lodash/cloneDeep';
import StreamerGetChat from "./StreamerGetChat";
import {
    CircularProgress, createMuiTheme,
    Grid,
    GridList,
    GridListTile,
    GridListTileBar, Icon,
    IconButton,
    makeStyles, Menu, MenuItem, MuiThemeProvider,
    SvgIcon, Typography
} from "@material-ui/core";
import {Link} from "react-router-dom";
import {Skeleton, SpeedDialIcon} from "@material-ui/lab";
import {GetApp, PlayArrow} from "@material-ui/icons";
import moment from "moment/moment";

const styles = makeStyles((theme) => ({
    GridListTile: {
        width: 320,
        height: 180,
        padding: 2
    },
    topTileBar: {
        backgroundColor: "unset"
    },
    menuIcons: {
        padding: 0,
        paddingRight: 12
    },
    loading: {
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
}));

const theme = createMuiTheme({
    overrides: {
        MuiGridListTileBar: {
            root: {
                maxHeight: 48
            }
        }
    }
})

export default function StreamerStreams(passedStream) {
    const [stream, setStream] = useState(passedStream.passedStream);
    const [addButtonClass, setAddButtonClass] = useState("add");
    const [addButtonDisabled, setAddButtonDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteIsLoading, setDeleteIsLoading] = useState(false);
    const [alreadyAdded, setAlreadyAdded] = useState(false);
    const [alreadyDeleted, setAlreadyDeleted] = useState(true);
    const [addButtontext, setAddButtonText] = useState("Add");
    const [deleteButtonText, setDeleteButtonText] = useState("Delete");
    const [hideDelete, setHideDelete] = useState(false);
    const [watchButtonDisabled, setWatchButtonDisabled] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadIconColour, setDownloadIconColour] = useState("white");
    const [anchorEl, setAnchorEl] = useState(null);
    const [deleted, setDeleted] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false);
    const open = Boolean(anchorEl);
    const length = new moment.duration(passedStream.passedStream.duration, "seconds");
    const hours = length.hours() + (length.days() * 24);
    //const length = new moment().startOf('year').seconds(172800).format('DDD HH:mm:ss')
    //const length = new Date(172800 * 1000).toISOString().substr(11, 8);

    var classes = styles();

    if (passedStream.passedStream.id !== -1 && !alreadyAdded) { // if id is not -1, already present
        if (passedStream.passedStream.downloading) {
            setWatchButtonDisabled(true);
            //setDownloaded(true);
            setDownloading(true);
            setDownloadIconColour("orange");
            setAddButtonDisabled(true);
        } else {
            setDownloaded(true);
            setDownloadIconColour("grey");
            setAddButtonDisabled(true);
        }
        setAlreadyAdded(true);
    }

    useEffect(() => {
        var streamSize = stream.size;
        var newStream = cloneDeep(stream);
        if (((streamSize / 1024) / 1024) > 1000) {
            newStream.size = parseFloat(((streamSize / 1024) / 1024) / 1024).toFixed(2) + " GB";
        } else {
            newStream.size = parseFloat((streamSize / 1024) / 1024).toFixed(2) + " MB";
        }
        setStream(newStream);

        if (stream.thumbnailLocation === "") {
            // TODO handle default image
        }
    }, [])

    function handleDownloadVodClick() {
        setIsLoading(true);
        setAddButtonText(null);

        downloadVod();
    }

    function handlePlayButtonClick() {
        window.location = stream.id === -1 ? stream.url : stream.downloadLocation;
    }

    function handleDeleteClick() {
        setIsLoading(true);

        deleteVod();
    }

    async function downloadVod() {
        var removedSizeStream = cloneDeep(stream);
        delete removedSizeStream.size;
        const response = await fetch('backgroundTask/downloadStream',
            {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(removedSizeStream)
            });

        if (response.ok) {
            setIsLoading(false);
            setDownloadIconColour("orange")
            setAddButtonDisabled(true);
        }
    }

    async function deleteVod() {
        const request = await fetch('streams/deleteStream' +
            '?streamId=' + stream.streamId,
            {
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        var response = await request.json();

        if (response.isStillAvailable !== void (0) && response.isStillAvailable !== null) {
            if (response.isStillAvailable) {
                setDownloaded(false);
                setIsLoading(false);
                setAddButtonDisabled(false);
                setDownloadIconColour("white");
            } else {
                delete document.getElementById(stream.key);
            }
        }
    }

    function handleMenuClick(event) {
        setAnchorEl(event.currentTarget);
    }

    function handleMenuClose() {
        setAnchorEl(null);
    }

    function handleImageLoad() {
        setImageLoaded(true);
    }

    return (
        <GridListTile id={stream.key} className={classes.GridListTile} key={stream.key}>
            <a href={stream.id == -1 ? stream.url : stream.downloadLocation}>
                <img alt="thumbnail" hidden={!imageLoaded} onLoad={handleImageLoad} src={stream.thumbnailLocation}/>
                <div hidden={imageLoaded} className={classes.loading}>
                    <CircularProgress/>
                </div>
            </a>

            <MuiThemeProvider theme={theme}>
                <GridListTileBar titlePosition={"top"} className={classes.topTileBar} title={hours + "h" + length.minutes() + "m" + length.seconds() + "s"}
                                 subtitle={new Date(stream.createdAt).toLocaleString()} actionIcon={
                    <div>
                        <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true"
                                    onClick={handleMenuClick}>
                            <SvgIcon>
                                <path fill="white"
                                      d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                            </SvgIcon>
                        </IconButton>
                        <Menu
                            id="long-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={open}
                            onClose={handleMenuClose}
                        >
                            <StreamerGetChat id={stream.streamId} downloaded={downloaded}/>
                            <MenuItem disabled={!downloaded && !downloading} onClick={handleDeleteClick}>
                                <IconButton className={classes.menuIcons}>
                                    <SvgIcon>
                                        <path fill={downloaded ? "white" : "darkgrey"}
                                              d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                                    </SvgIcon>
                                </IconButton>Delete</MenuItem>
                        </Menu>
                    </div>
                }/>
            </MuiThemeProvider>
            <GridListTileBar title={stream.title}
                             actionIcon={
                                 <div>
                                     <div hidden={isLoading}>
                                         {downloaded ?
                                             <IconButton onClick={handlePlayButtonClick}>
                                                 <PlayArrow style={{color: "white"}}/>
                                             </IconButton>
                                             :
                                             <IconButton disabled={addButtonDisabled} onClick={handleDownloadVodClick}>
                                                 <GetApp style={{color: downloadIconColour}}/>
                                             </IconButton>
                                         }
                                     </div>
                                     <CircularProgress hidden={!isLoading}/>
                                 </div>
                             }
            />
        </GridListTile>
    )
}