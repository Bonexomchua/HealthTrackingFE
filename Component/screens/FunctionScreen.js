import React, { useState } from 'react';
import { View, Text, Dimensions, Pressable } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import DrinkingScreen from './DrinkingScreen';
import ExerciseScreen from './ExerciseScreen';
import SleepingScreen from './SleepingScreen';

const initialLayout = { width: Dimensions.get('window').width };


export default function FunctionsScreen() {
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'drink', title: 'Drinking' },
        { key: 'exercise', title: 'Exercise' },
        { key: 'sleep', title: 'Sleep' },
    ]);

    const renderScene = SceneMap({
        drink: DrinkingScreen,
        exercise: ExerciseScreen,
        sleep: SleepingScreen,
    });

    return (
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={initialLayout}
            swipeEnabled={true}
            renderTabBar={props => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', marginTop: 35 }}>
                    {props.navigationState.routes.map((route, i) => {
                        const isFocused = props.navigationState.index === i;
                        return (
                            <Pressable
                                key={route.key}
                                onPress={() => props.jumpTo(route.key)}
                                style={{
                                    paddingVertical: 10,
                                    borderBottomWidth: isFocused ? 2 : 0,
                                    borderBottomColor: isFocused ? '#53A69D' : 'transparent',
                                }}
                            >
                                <Text style={{ color: isFocused ? '#53A69D' : '#aaa', fontWeight: isFocused ? 'bold' : 'normal' }}>
                                    {route.title}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        />


    );
}
