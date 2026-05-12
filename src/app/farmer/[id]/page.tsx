import ProfileScreen from '@/components/ProfileScreen';

export default function PublicFarmerProfilePage({ params }: { params: { id: string } }) {
    const id = params.id;
    return <ProfileScreen role="farmer" userId={id} readOnly />;
}
