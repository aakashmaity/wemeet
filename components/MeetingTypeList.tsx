"use client"


import React, { useState } from 'react'
import HomeCard from './HomeCard'
import { useRouter } from 'next/navigation'
import MeetingModel from './MeetingModel'
import { useUser } from '@clerk/nextjs'
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk'
import { useToast } from "@/hooks/use-toast"
import { Textarea } from './ui/textarea'
import ReactDatePicker from "react-datepicker";
import { Input } from './ui/input'



const MeetingTypeList = () => {
    const { toast } = useToast()
    const router = useRouter();

    const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>()
    const [values,setValues] = useState({
        dateTime : new Date(),
        description : '',
        link: ''
    });
    const [callDetails, setCallDetails] = useState<Call>()

    const {user} = useUser();
    const client = useStreamVideoClient();

    
    const createMeeting = async() => {
        if(!client || !user) return;

        try {

            if(!values.dateTime){
                toast({ title: "Please select a date and time"})
                return
            }

            const id = crypto.randomUUID();
            const call = client.call('default',id);

            if(!call){
                throw new Error('Failed to create call');
            }

            const startAt = values.dateTime.toISOString() || new Date(Date.now()).toISOString();
            const description = values.description || 'Instant meeting';

            await call.getOrCreate({
                data:{
                    starts_at: startAt,
                    custom:{
                        description
                    }
                }
            })

            setCallDetails(call);

            if(!values.description){
                router.push(`/meeting/${call.id}`);
            }
            toast({ title: "Meeting created"})

        } catch (err) {
            console.log(err)
            toast({ title: "Failed to create meeting"})
        }
    }

    const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`


  return (
    <section className='grid grid-col-1 gap-5 md:grid-cols-2 xl:grid-cols-4'>
        <HomeCard 
            img="/icons/add-meeting.svg"
            className ="bg-orange-1"
            title="New Meeting"
            description="Start an instant meeting"
            handleClick={() => setMeetingState('isInstantMeeting')}
        />
        <HomeCard 
             img="/icons/schedule.svg"
             className ="bg-blue-1"
             title="Schedule Meeting"
             description="Plan your meeting"
             handleClick={() => setMeetingState('isScheduleMeeting')}
        />
        <HomeCard 
             img="/icons/recordings.svg"
             className ="bg-purple-1"
             title="View Recordings"
             description="Check out your recordings"
             handleClick={() => router.push('/recordings')}
        />
        <HomeCard 
             img="/icons/join-meeting.svg"
             className ="bg-yellow-1"
             title="Join Meeting"
             description="via invitation link"
             handleClick={() => setMeetingState('isJoiningMeeting')}
        />

        {!callDetails ? (
            <MeetingModel
                isOpen = {meetingState === 'isScheduleMeeting'}
                onClose = {() => setMeetingState(undefined)}
                title="Create meeting"
                handleClick={createMeeting}
            >
                <div className='flex flex-col gap-2.5'>
                    <label className='text-base text-normal leading-[22px] text-sky-2'>Add a description</label>
                    <Textarea className='border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0'
                        onChange={(e) => {
                            setValues({...values, description: e.target.value})
                        }}
                    />
                </div>
                <div className='flex w-full flex-col gap-2.5'>
                    <label className='text-base text-normal leading-[22px] text-sky-2'>Select Date and time</label>
                    <ReactDatePicker
                        selected={values.dateTime}
                        onChange={(date) => setValues({...values, dateTime: date!})}
                        showTimeSelect
                        timeFormat='HH:mm'
                        timeIntervals={15}
                        timeCaption='time'
                        dateFormat='MMMM d, yyyy h:mm aa'
                        className='w-full rounded bg-dark-3 p-2 focus:outline-none'
                    />
                </div>
            </MeetingModel>
        ):(
            <MeetingModel
                isOpen = {meetingState === 'isScheduleMeeting'}
                onClose = {() => setMeetingState(undefined)}
                title="Meeting Created"
                className = "text-center"
                handleClick={() => {
                    navigator.clipboard.writeText(meetingLink)
                    toast({ title: "Meeting link copied"})
                }}
                image='/icons/checked.svg'
                buttonIcon='/icons/copy.svg'
                buttonText='Copy meeting link'
            />
        )}
        <MeetingModel
            isOpen = {meetingState === 'isInstantMeeting'}
            onClose = {() => setMeetingState(undefined)}
            title="Start an instant meeting"
            className = "text-center"
            buttonText="Start Meeting"
            handleClick={createMeeting}
        />
        <MeetingModel
            isOpen = {meetingState === 'isJoiningMeeting'}
            onClose = {() => setMeetingState(undefined)}
            title="Type the meeting link"
            className = "text-center"
            buttonText="Join Meeting"
            handleClick={() => router.push(values.link)}
        >
            <Input
                placeholder='paste your meeting link...'
                type='text'
                className='border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0'
                onChange={(e) => setValues({...values, link: e.target.value})}
            />
        </MeetingModel>

    </section>
  )
}

export default MeetingTypeList