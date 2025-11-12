import Link from 'next/link'

const members = [
    {
        name: 'Dr. Lujain',
        role: 'Project Supervisor',
        avatar: '/Dr. Lujain Qassim Nasir.jpg',
        link: '#',
    },
    {
        name: 'Abdullah Talaat Aref',
        role: 'Project Leader',
        avatar: '/Abdullah Talaat Aref.jpg',
        link: '#',
    },
    {
        name: 'Rssol Amer Hamed',
        role: 'Frontend/Backend ',
        avatar: '/Rssol Amer Hamed.jpg',
        link: '#',
    },
    {
        name: 'Abdullah Ahmed Adel',
        role: 'UX/UI + Backend',
        avatar: '/Abdullah Ahmed Adel.jpg',
        link: '#',
    },
    {
        name: 'Abdulla Ahmed Abd',
        role: 'Data Base + UI',
        avatar: '/Abdulla Ahmed Abd.jpg',
        link: '#',
    },
    {
        name: 'Samer Hussein Saydaar',
        role: 'Data Base + UI',
        avatar: '/Samer Hussien Saydaa.jpg',
        link: '#',
    },
]

export default function TeamSection() {
    return (
        <section id="team" className="bg-white py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-5xl border-t px-6">
                <span className="text-caption -ml-6 -mt-3.5 block w-max bg-white px-6 dark:bg-gray-950">Team</span>
                <div className="mt-12 gap-4 sm:grid sm:grid-cols-2 md:mt-24">
                    <div className="sm:w-2/5">
                        <h2 className="text-3xl font-bold sm:text-4xl">Our dream team</h2>
                    </div>
                    <div className="mt-6 sm:mt-0">
                        <p>Meet the passionate team behind Smart Notes. We're dedicated to creating innovative solutions that help you capture, organize, and enhance your ideas.</p>
                    </div>
                </div>
                <div className="mt-12 md:mt-24">
                    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {members.map((member, index) => (
                            <div
                                key={index}
                                className="group overflow-hidden">
                                <img
                                    className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-[22.5rem] group-hover:rounded-xl"
                                    src={member.avatar}
                                    alt="team member"
                                    width="826"
                                    height="1239"
                                />
                                <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-base font-medium transition-all duration-500 group-hover:tracking-wider">{member.name}</h3>
                                            {member.role && (
                                                <p className="text-xs text-muted-foreground mt-1">{member.role}</p>
                                            )}
                                        </div>
                                        <span className="text-xs">_0{index + 1}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
