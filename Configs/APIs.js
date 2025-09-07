import axios from "axios";

export const BASE_URL = 'http://192.168.1.194:5260/api/';

export const endpoints = {
    'user': 'users/',
    'register': 'Auth/register/',
    'login': 'Auth/login/',
    'profile': 'profiles/',
    'event': 'events/',
    'usermanagement': 'admin-users/',
    'getusernamebyids': 'AppUser/get-username-by-ids/',

    //WATER
    'getcurrwater': 'Water/get-current-water/',
    'updatewater': 'Water/update-water/',
    'getallwater': 'Water/get-all-water/',
    //BODYMETRIC
    'createmetric': 'BodyMetricCotroller/init-bodymetric/',
    'getlatestmetric': 'BodyMetricCotroller/get-body-metric-latest/',
    //SETTING
    'getallsetting': 'UserSetting/get-all-setting/',
    'updatecurrentsetting': 'AppUser/update-current-setting',
    'createsetting': 'UserSetting/create-setting',
    //EXERCISE
    'updateexercise': 'Exercise/update-ex',
    'getallexercise': 'Exercise/get-user-exercise',
    'getallexercisea': 'Exercise/get-user-exercisea',
    'createactivity': 'Exercise/create-activity',
    'getuseractivity': 'Exercise/get-user-activity',
    //SLEEP
    'addsleep': 'Sleep/create-sleep',
    'getallsleep': 'Sleep/get-all-sleep',
    //GET WEEK
    'getweekwater': 'Water/get-latest-week',
    'getweekexercise': 'Exercise/get-latest-week',
    'getweeksleep': 'Sleep/get-latest-week',
    //APPUSER
    'getallexpert': 'AppUser/experts',
    'uploadavatar': 'AppUser/upload-avatar',
    'uploadvideo': 'AppUser/upload-video',
};

export default axios.create({
    baseURL: BASE_URL
});