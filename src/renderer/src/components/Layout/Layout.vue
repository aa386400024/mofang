<template>
    <div class="flex flex-col h-screen w-screen">
        <Header />
        <AddressBar />
        <div class="flex flex-1 min-h-0">
            <Sidebar />
            <main class="flex-1 overflow-y-auto p-4 bg-gray-50">
                <router-view />
            </main>
            <!-- <Footer /> -->
        </div>
    </div>
</template>
<script setup lang="ts">
import { Sidebar, Header, AddressBar } from './index'
</script>